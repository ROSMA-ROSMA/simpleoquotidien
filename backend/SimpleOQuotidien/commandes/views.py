from django.contrib.auth import get_user_model
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import permissions, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from commandes.models import Category, Order, OrderStatusChoices, Quote, QuoteStatusChoices, Service
from commandes.serializers import CategorySerializer, OrderSerializer, QuoteSerializer, ServiceSerializer
from commandes.tokens import verify_action_token
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import permissions, viewsets
from notifications.services import (
    envoyer_notification_devis_client,
    notifier_acceptation_devis_prestataire,
    notifier_refus_devis_agents,
    notifier_validation_devis_agent,
)
from drf_spectacular.utils import extend_schema
from users.models import AssignmentStatusChoices, RoleChoices

User = get_user_model()

@extend_schema(exclude=True)
class DirectQuoteActionView(APIView):
    permission_classes = []

    def get(self, request, token):
        data = verify_action_token(token)

        if not data:
            return HttpResponse(
                '<h2>❌ Le lien est invalide ou a expiré.</h2>', status=400
            )

        # Filtrage strict par order__uuid
        quote = get_object_or_404(
            Quote, id=data['quote_id'], order__uuid=data['order_uuid']
        )
        order = quote.order

        if quote.status != QuoteStatusChoices.ENVOYE:
            return HttpResponse(
                '<h2>ℹ Ce devis a déjà été traité'
                f' ({quote.get_status_display()}).</h2>'
            )

        if data['action'] == 'ACCEPTER':
            quote.status = QuoteStatusChoices.ACCEPTE
            quote.save()

            order.status = OrderStatusChoices.ACCEPTEE
            order.save()

            notifier_acceptation_devis_prestataire(quote)
            notifier_validation_devis_agent(quote)

            return HttpResponse(
                '<h2 style="color: green; text-align: center; margin-top:'
                ' 50px;">✔ Devis accepté avec succès !</h2>'
            )

        elif data['action'] == 'REFUSER':
            quote.status = QuoteStatusChoices.REFUSE
            quote.save()

            order.status = OrderStatusChoices.EN_TRAITEMENT
            order.save()

            notifier_refus_devis_agents(quote)

            return HttpResponse(
                '<h2 style="color: #dc2626; text-align: center; margin-top:'
                ' 50px;">✖ Devis refusé. Un agent a été notifié pour vous'
                ' réassigner un prestataire.</h2>'
            )

        return HttpResponse('<h2>Action invalide.</h2>', status=400)


class QuoteViewSet(viewsets.ModelViewSet):
    serializer_class = QuoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Quote.objects.select_related('order', 'order__client')
        if user.role == RoleChoices.CLIENT:
            return qs.filter(order__client=user)
        if user.role == RoleChoices.PRESTATAIRE:
            return qs.filter(order__assignments__prestataire__user=user).distinct()
        return qs  # AGENT / ADMIN voient tout

    def perform_create(self, serializer):
        order = serializer.validated_data['order']
        user = self.request.user
        if user.role == RoleChoices.PRESTATAIRE:
            profile = getattr(user, 'prestataire_profile', None)
            has_accepted = profile is not None and order.assignments.filter(
                prestataire=profile, status=AssignmentStatusChoices.ACCEPTEE
            ).exists()
            if not has_accepted:
                raise PermissionDenied(
                    "Vous devez d'abord accepter cette mission avant de soumettre"
                    ' un devis.'
                )

        # Order.quote est un OneToOneField : si une commande a déjà eu un devis
        # (ex. refusé par le client, puis réassignée à un nouveau prestataire),
        # on réutilise cette même ligne plutôt que de tenter d'en recréer une
        # (ce qui violerait la contrainte d'unicité).
        existing = getattr(order, 'quote', None)
        if existing is not None:
            existing.price = serializer.validated_data.get('price', existing.price)
            existing.description = serializer.validated_data.get(
                'description', existing.description
            )
            if 'pdf_file' in serializer.validated_data:
                existing.pdf_file = serializer.validated_data['pdf_file']
            existing.status = QuoteStatusChoices.ENVOYE
            existing.save()
            quote = existing
        else:
            quote = serializer.save(status=QuoteStatusChoices.ENVOYE)
        envoyer_notification_devis_client(self.request, quote)

    def perform_update(self, serializer):
        quote = self.get_object()
        new_status = serializer.validated_data.get('status', quote.status)
        user = self.request.user

        if new_status in (QuoteStatusChoices.ACCEPTE, QuoteStatusChoices.REFUSE):
            if user.role != RoleChoices.CLIENT or quote.order.client_id != user.id:
                raise PermissionDenied(
                    'Seul le client de la commande peut valider ou refuser ce'
                    ' devis.'
                )
            if quote.status != QuoteStatusChoices.ENVOYE:
                raise PermissionDenied('Ce devis a déjà été traité.')

        quote = serializer.save()

        if new_status == QuoteStatusChoices.ACCEPTE:
            quote.order.status = OrderStatusChoices.ACCEPTEE
            quote.order.save(update_fields=['status'])
            notifier_acceptation_devis_prestataire(quote)
            notifier_validation_devis_agent(quote)
        elif new_status == QuoteStatusChoices.REFUSE:
            quote.order.status = OrderStatusChoices.EN_TRAITEMENT
            quote.order.save(update_fields=['status'])
            notifier_refus_devis_agents(quote)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class ServiceViewSet(viewsets.ModelViewSet):
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = Service.objects.select_related('category', 'prestataire').all()
        params = self.request.query_params
        prestataire_id = params.get('prestataire')
        category_id = params.get('category')
        city = params.get('city')
        if prestataire_id:
            qs = qs.filter(prestataire_id=prestataire_id)
        if category_id:
            qs = qs.filter(category_id=category_id)
        if city:
            qs = qs.filter(city__icontains=city)
        return qs

    def perform_create(self, serializer):
        profile = getattr(self.request.user, 'prestataire_profile', None)
        if profile is None:
            raise PermissionDenied('Seuls les prestataires peuvent créer un service.')
        serializer.save(prestataire=profile)

    def perform_update(self, serializer):
        service = self.get_object()
        if service.prestataire.user_id != self.request.user.id:
            raise PermissionDenied('Vous ne pouvez modifier que vos propres services.')
        serializer.save()

    def perform_destroy(self, instance):
        if instance.prestataire.user_id != self.request.user.id:
            raise PermissionDenied('Vous ne pouvez supprimer que vos propres services.')
        instance.delete()


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'uuid'
    
    def perform_create(self, serializer):
        serializer.save(client=self.request.user)

    def get_queryset(self):
        user = self.request.user
        if user.role == 'CLIENT':
            return Order.objects.filter(client=user)
        return Order.objects.all()


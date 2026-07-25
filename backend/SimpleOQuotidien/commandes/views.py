from django.contrib.auth import get_user_model
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import permissions, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from commandes.models import Category, Order, OrderStatusChoices, Quote, QuoteStatusChoices
from commandes.serializers import CategorySerializer, OrderSerializer, QuoteSerializer
from commandes.tokens import verify_action_token
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import permissions, viewsets
from notifications.services import (
    envoyer_notification_devis_client,
    notifier_acceptation_devis_prestataire,
    notifier_refus_devis_agents,
)
from drf_spectacular.utils import extend_schema

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
    queryset = Quote.objects.all()
    serializer_class = QuoteSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        quote = serializer.save(status=QuoteStatusChoices.ENVOYE)
        envoyer_notification_devis_client(self.request, quote)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


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


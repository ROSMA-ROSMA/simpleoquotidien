from django.conf import settings
from django.core.mail import send_mail
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status as http_status

from .models import Category, Order, Quote, Service
from .serializers import CategorySerializer, OrderSerializer, QuoteSerializer, ServiceSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(client=self.request.user)

    def get_queryset(self):
        user = self.request.user
        if user.role == 'CLIENT':
            return Order.objects.filter(client=user)
        return Order.objects.all()

    @action(detail=True, methods=['post'], url_path='contact-client')
    def contact_client(self, request, pk=None):
        order = self.get_object()
        user = request.user

        is_agent_or_admin = user.role in ('AGENT', 'ADMIN')
        is_assigned_prestataire = order.assignments.filter(
            prestataire__user=user, status='ACCEPTEE',
        ).exists()
        if not (is_agent_or_admin or is_assigned_prestataire):
            return Response(
                {'detail': "Vous n'êtes pas autorisé à contacter ce client."},
                status=http_status.HTTP_403_FORBIDDEN,
            )

        message = request.data.get('message', '').strip()
        if not message:
            return Response({'detail': 'Le message est requis.'}, status=http_status.HTTP_400_BAD_REQUEST)
        subject = request.data.get('subject') or f"Votre commande #{order.id} — SimpleÔQuotidien"

        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [order.client.email],
            fail_silently=False,
        )
        return Response({'sent': True})


class QuoteViewSet(viewsets.ModelViewSet):
    queryset = Quote.objects.all()
    serializer_class = QuoteSerializer
    permission_classes = [IsAuthenticated]


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.select_related('prestataire', 'category').all()
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        category_id = self.request.query_params.get('category')
        city = self.request.query_params.get('city')
        prestataire_id = self.request.query_params.get('prestataire')
        if category_id:
            qs = qs.filter(category_id=category_id)
        if city:
            qs = qs.filter(city__icontains=city)
        if prestataire_id:
            qs = qs.filter(prestataire_id=prestataire_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(prestataire=self.request.user.prestataire_profile)

    def perform_update(self, serializer):
        if serializer.instance.prestataire.user_id != self.request.user.id:
            raise permissions.PermissionDenied("Vous ne pouvez modifier que vos propres services.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.prestataire.user_id != self.request.user.id:
            raise permissions.PermissionDenied("Vous ne pouvez supprimer que vos propres services.")
        instance.delete()
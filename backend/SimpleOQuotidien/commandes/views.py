from rest_framework import viewsets, permissions
from rest_framework.permissions import IsAuthenticated

from .models import Category, Order, Quote
from .serializers import CategorySerializer, OrderSerializer, QuoteSerializer


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


class QuoteViewSet(viewsets.ModelViewSet):
    queryset = Quote.objects.all()
    serializer_class = QuoteSerializer
    permission_classes = [IsAuthenticated]
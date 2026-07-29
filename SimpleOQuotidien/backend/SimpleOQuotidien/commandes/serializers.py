from rest_framework import serializers
from .models import Category, Order, Quote, Service
from users.serializers import UtilisateurSerializer


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'nom', 'description']


class QuoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quote
        fields = ['id', 'status', 'price', 'order']


class OrderSerializer(serializers.ModelSerializer):
    quote = QuoteSerializer(read_only=True)
    category_nom = serializers.CharField(source='category.nom', read_only=True)
    client_detail = UtilisateurSerializer(source='client', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'status', 'description', 'localisation', 'date', 'budget',
            'images', 'category', 'category_nom', 'client', 'client_detail', 'quote',
        ]
        read_only_fields = ['client']


class ServiceSerializer(serializers.ModelSerializer):
    category_nom = serializers.CharField(source='category.nom', read_only=True)

    class Meta:
        model = Service
        fields = ['id', 'prestataire', 'category', 'category_nom', 'price', 'city', 'description', 'date_creation']
        read_only_fields = ['id', 'prestataire', 'date_creation']
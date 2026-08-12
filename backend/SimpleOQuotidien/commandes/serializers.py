from rest_framework import serializers
from .models import Category, Order, Quote, Service
from users.serializers import UtilisateurSerializer


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'nom', 'description', 'image']


class ServiceSerializer(serializers.ModelSerializer):
    category_nom = serializers.CharField(source='category.nom', read_only=True)
    prestataire_nom = serializers.CharField(source='prestataire.company_name', read_only=True)

    class Meta:
        model = Service
        fields = [
            'id', 'prestataire', 'prestataire_nom', 'category', 'category_nom',
            'price', 'city', 'description', 'image', 'date_creation',
        ]
        read_only_fields = ['id', 'prestataire', 'date_creation']


class QuoteSerializer(serializers.ModelSerializer):
    order = serializers.SlugRelatedField(slug_field='uuid', queryset=Order.objects.all())

    class Meta:
        model = Quote
        fields = ['id', 'status', 'price', 'description', 'pdf_file', 'order']


class OrderSerializer(serializers.ModelSerializer):
    quote = QuoteSerializer(read_only=True)
    category_nom = serializers.CharField(source='category.nom', read_only=True)
    client_detail = UtilisateurSerializer(source='client', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'uuid', 'status', 'description', 'localisation', 'date', 'budget',
            'images', 'voice_note', 'category', 'category_nom', 'client', 'client_detail', 'quote',
        ]
        read_only_fields = ['client']
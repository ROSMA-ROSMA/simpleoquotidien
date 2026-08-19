from decimal import Decimal

from rest_framework import serializers
from .constants import VILLES_VALIDES
from .models import Category, Order, Quote, Service
from users.serializers import PaymentSerializer, UtilisateurSerializer


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'nom', 'description', 'image']


class ServiceSerializer(serializers.ModelSerializer):
    category_nom = serializers.CharField(source='category.nom', read_only=True)
    prestataire_nom = serializers.CharField(source='prestataire.company_name', read_only=True)
    description = serializers.CharField(
        required=False, allow_blank=True, allow_null=True, max_length=2000,
    )

    class Meta:
        model = Service
        fields = [
            'id', 'prestataire', 'prestataire_nom', 'category', 'category_nom',
            'price', 'city', 'description', 'image', 'date_creation',
        ]
        read_only_fields = ['id', 'prestataire', 'date_creation']

    def validate_price(self, value):
        if value is None or value <= Decimal('0'):
            raise serializers.ValidationError('Le prix doit être strictement supérieur à 0.')
        return value

    def validate_city(self, value):
        value = (value or '').strip()
        if not value:
            raise serializers.ValidationError('La ville est obligatoire.')
        if value.upper() not in VILLES_VALIDES:
            raise serializers.ValidationError(
                "Ville inconnue. Merci de choisir une ville valide dans la liste proposée."
            )
        return value


class QuoteSerializer(serializers.ModelSerializer):
    order = serializers.SlugRelatedField(slug_field='uuid', queryset=Order.objects.all())

    class Meta:
        model = Quote
        fields = ['id', 'status', 'price', 'description', 'pdf_file', 'order']


class OrderSerializer(serializers.ModelSerializer):
    quote = QuoteSerializer(read_only=True)
    category_nom = serializers.CharField(source='category.nom', read_only=True)
    client_detail = UtilisateurSerializer(source='client', read_only=True)
    payment = PaymentSerializer(read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'uuid', 'status', 'description', 'localisation', 'date', 'budget',
            'images', 'voice_note', 'category', 'category_nom', 'client', 'client_detail', 'quote',
            'payment',
        ]
        read_only_fields = ['client']
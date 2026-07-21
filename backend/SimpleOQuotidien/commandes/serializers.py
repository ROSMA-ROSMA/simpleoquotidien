from rest_framework import serializers
from .models import Category, Order, Quote


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

    class Meta:
        model = Order
        fields = [
            'id', 'status', 'description', 'localisation', 'date', 'budget',
            'images', 'category', 'category_nom', 'client', 'quote',
        ]
        read_only_fields = ['client']
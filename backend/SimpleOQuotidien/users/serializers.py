from rest_framework import serializers
from djoser.serializers import UserCreateSerializer, UserSerializer
from django.db import transaction
from .models import Utilisateur, PrestataireProfile, Assignment, Subscription, Notes, RoleChoices


# --- UTILISATEURS ---

class UtilisateurCreateSerializer(UserCreateSerializer):
    class Meta(UserCreateSerializer.Meta):
        model = Utilisateur
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'role', 'pays', 'password']


class UtilisateurSerializer(UserSerializer):
    class Meta(UserSerializer.Meta):
        model = Utilisateur
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'role', 'pays']


# --- PRESTATAIRE ---

# Serializer d'inscription spécifique au Prestataire
class PrestataireCreateSerializer(serializers.ModelSerializer):
    user = UtilisateurCreateSerializer()

    class Meta:
        model = PrestataireProfile
        fields = [
            'user', 'company_name', 'services', 'zones_couvertes', 
            'langue', 'tarif', 'cni_passeport', 'justificatif', 'photo'
        ]

    @transaction.atomic
    def create(self, validated_data):
        user_data = validated_data.pop('user')
        # Forcer le rôle à PRESTATAIRE
        user_data['role'] = RoleChoices.PRESTATAIRE
        
        # Création sécurisée de l'Utilisateur avec mot de passe haché
        user_serializer = UtilisateurCreateSerializer(data=user_data)
        user_serializer.is_valid(raise_exception=True)
        user = user_serializer.save()

        # Création du profil Prestataire associé
        prestataire_profile = PrestataireProfile.objects.create(user=user, **validated_data)
        return prestataire_profile


# Serializer de lecture et mise à jour
class PrestataireProfileSerializer(serializers.ModelSerializer):
    user = UtilisateurSerializer(read_only=True)

    class Meta:
        model = PrestataireProfile
        fields = [
            'id', 'user', 'company_name', 'services', 'zones_couvertes', 'langue', 
            'tarif', 'verification_status', 'cni_passeport', 'justificatif', 
            'photo', 'date_creation', 'date_modification',
        ]
        read_only_fields = ['id', 'verification_status', 'date_creation', 'date_modification']


# --- AUTRES SÉRIALIZERS ---

class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = ['id', 'methode', 'order', 'prestataire', 'qualifier', 'date_creation']
        read_only_fields = ['id', 'date_creation']


class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = ['id', 'plan', 'statut', 'mode_payment', 'prestataire', 'date_creation']
        read_only_fields = ['id', 'date_creation']


class NotesSerializer(serializers.ModelSerializer):
    author_email = serializers.EmailField(source='author.email', read_only=True)

    class Meta:
        model = Notes
        fields = ['id', 'etoile', 'commentaire', 'prestataire', 'author', 'author_email', 'date_creation']
        read_only_fields = ['id', 'author', 'date_creation']
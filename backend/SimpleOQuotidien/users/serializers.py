from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from djoser.serializers import UserCreatePasswordRetypeSerializer, UserSerializer
from django.db import transaction
from .models import Utilisateur, PrestataireProfile, Assignment, Subscription, Notes, Payment, RoleChoices
from commandes.models import Order, OrderStatusChoices
from djoser.conf import settings as djoser_settings
# Import de ta classe d'email personnalisée d'activation
from .email import ActivationEmail


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Distingue les 3 causes d'échec de connexion (SimpleJWT renvoie par défaut le
    même message "No active account found..." qu'il s'agisse d'un email inconnu,
    d'un mauvais mot de passe ou d'un compte pas encore confirmé par email —
    ce qui affichait à tort "vérifiez votre boîte mail" même en cas de mot de
    passe erroné)."""

    def validate(self, attrs):
        email = attrs.get(self.username_field)
        password = attrs.get('password')

        try:
            user = Utilisateur.objects.get(**{self.username_field: email})
        except Utilisateur.DoesNotExist:
            raise AuthenticationFailed(
                "Aucun compte n'est associé à cette adresse e-mail.",
                'no_account',
            )

        if not user.check_password(password):
            raise AuthenticationFailed('Mot de passe incorrect.', 'invalid_password')

        if not user.is_active:
            raise AuthenticationFailed(
                "Confirmez votre adresse e-mail pour activer votre compte. "
                "Vérifiez votre boîte de réception (et vos spams).",
                'email_not_confirmed',
            )

        return super().validate(attrs)


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(
        required=True,
        help_text="Le refresh token à invalider (blacklist)."
    )
# --- UTILISATEURS ---


class UtilisateurCreateSerializer(UserCreatePasswordRetypeSerializer):
    re_password = serializers.CharField(
        style={'input_type': 'password'}, write_only=True
    )
    is_active = serializers.BooleanField(read_only=True)
    class Meta(UserCreatePasswordRetypeSerializer.Meta):
        model = Utilisateur
        fields = [
            'id',
            'email',
            'username',
            'first_name',
            'last_name',
            'role',
            'pays',
            'is_active',
            'password',
            're_password',  # Valide maintenant sans erreur de modèle
        ]
        read_only_fields = ['is_active']


class UtilisateurSerializer(UserSerializer):
    class Meta(UserSerializer.Meta):
        model = Utilisateur
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'role', 'pays', 'is_active']


# --- PRESTATAIRE ---


class PrestataireCreateSerializer(serializers.ModelSerializer):
    user = UtilisateurCreateSerializer()

    class Meta:
        model = PrestataireProfile
        fields = [
            'user',
            'company_name',
            'services',
            'zones_couvertes',
            'langue',
            'tarif',
            'cni_passeport',
            'justificatif',
            'photo',
        ]

    @transaction.atomic
    def create(self, validated_data):
        user_data = validated_data.pop('user')
        user_data['role'] = RoleChoices.PRESTATAIRE

        # Sécurité pour re_password
        if 're_password' not in user_data and 'password' in user_data:
            user_data['re_password'] = user_data['password']

        # 1. Validation de l'utilisateur
        user_serializer = UtilisateurCreateSerializer(
            data=user_data, context=self.context
        )
        user_serializer.is_valid(raise_exception=True)

        # 2. Création de l'utilisateur
        user = user_serializer.save()

        # 3. Forcer le compte à inactif avant confirmation par mail (si SEND_ACTIVATION_EMAIL est True)
        if djoser_settings.SEND_ACTIVATION_EMAIL:
            user.is_active = False
            user.save()

            # 4. Envoi explicite du mail d'activation personnalisé !
            request = self.context.get('request')
            try:
                ActivationEmail(request, context={'user': user}).send([user.email])
            except Exception:
                # SMTP peut échouer sur les plateformes cloud (Render, etc.)
                # Le compte est quand même créé, l'email pourra être renvoyé plus tard
                import logging
                logging.getLogger(__name__).warning(
                    f"Échec envoi email d'activation pour {user.email}"
                )

        # 5. Création du profil Prestataire associé
        prestataire_profile = PrestataireProfile.objects.create(
            user=user, **validated_data
        )
        return prestataire_profile


# Serializer de lecture et mise à jour
class PrestataireProfileSerializer(serializers.ModelSerializer):
    user = UtilisateurSerializer(read_only=True)

    class Meta:
        model = PrestataireProfile
        fields = [
            'id', 'user', 'company_name', 'services', 'zones_couvertes', 'langue',
            'tarif', 'verification_status', 'motif_statut', 'cni_passeport', 'justificatif',
            'photo', 'date_creation', 'date_modification',
        ]
        read_only_fields = ['id', 'verification_status', 'motif_statut', 'date_creation', 'date_modification']


# --- AUTRES SÉRIALIZERS ---

class AssignmentSerializer(serializers.ModelSerializer):
    order = serializers.SlugRelatedField(slug_field='uuid', queryset=Order.objects.all())

    class Meta:
        model = Assignment
        fields = [
            'id', 'methode', 'order', 'prestataire', 'qualifier',
            'status', 'motif_refus', 'date_reponse', 'date_creation',
        ]
        read_only_fields = ['id', 'status', 'motif_refus', 'date_reponse', 'date_creation']


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'montant', 'statut', 'transaction_id', 'date_creation']
        read_only_fields = fields


class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = ['id', 'plan', 'statut', 'mode_payment', 'prestataire', 'date_creation']
        read_only_fields = ['id', 'date_creation']


class NotesSerializer(serializers.ModelSerializer):
    author_email = serializers.EmailField(source='author.email', read_only=True)
    order = serializers.SlugRelatedField(
        slug_field='uuid', queryset=Order.objects.all(), required=False, allow_null=True,
    )

    class Meta:
        model = Notes
        fields = ['id', 'etoile', 'commentaire', 'prestataire', 'author', 'author_email', 'order', 'date_creation']
        read_only_fields = ['id', 'author', 'date_creation']

    def validate_order(self, order):
        request = self.context.get('request')
        if order is not None and request is not None:
            if order.client_id != request.user.id:
                raise serializers.ValidationError("Cette commande ne vous appartient pas.")
            if order.status != OrderStatusChoices.TERMINEE:
                raise serializers.ValidationError("Cette commande n'est pas encore terminée.")
            existing = Notes.objects.filter(order=order)
            if self.instance is not None:
                existing = existing.exclude(pk=self.instance.pk)
            if existing.exists():
                raise serializers.ValidationError("Cette commande a déjà été notée.")
        return order
from rest_framework import viewsets, permissions
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Utilisateur, PrestataireProfile, Assignment, Subscription, Notes
from .serializers import RoleChoices, UtilisateurSerializer,PrestataireProfileSerializer,PrestataireCreateSerializer,AssignmentSerializer,SubscriptionSerializer,NotesSerializer

from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from drf_spectacular.utils import extend_schema, OpenApiResponse
from django.contrib.auth.tokens import default_token_generator
from .serializers import LogoutSerializer
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.generics import GenericAPIView
from rest_framework.response import Response
from djoser.serializers import ActivationSerializer

from notifications.services import (
    notifier_assignation_prestataire,
    notifier_attribution_client,
)


class AssignmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer l'assignation d'un Prestataire à une Commande.
    Accessible principalement par les AGENTS et ADMINS.
    """

    queryset = Assignment.objects.all().select_related(
        'order', 'prestataire__user'
    )
    serializer_class = AssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # 1. Sauvegarde de l'assignation en associant l'agent connecté (qualifier)
        assignment = serializer.save(qualifier=self.request.user)

        # 2. Notification In-App + E-mail au Prestataire (avec le template provider_assignment.html)
        notifier_assignation_prestataire(assignment)

        # 3. Notification In-App + E-mail au Client (avec le template general_notification.html)
        notifier_attribution_client(assignment)

class CustomActivationView(GenericAPIView):
    serializer_class = ActivationSerializer
    token_generator = default_token_generator

    def post(self, request, *args, **kwargs):
        # 1. Validation du jeton via Djoser
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # 2. Activation du compte
        user = serializer.user
        user.is_active = True
        user.save()

        # 3. Préparation des données utilisateur principales
        user_data = UtilisateurSerializer(user).data

        # 4. Inclusions des données du profil prestataire (sans la répéter !)
        if (
            user.role == RoleChoices.PRESTATAIRE
            and hasattr(user, 'prestataire_profile')
        ):
            profile_data = PrestataireProfileSerializer(
                user.prestataire_profile
            ).data
            profile_data.pop(
                'user', None
            )  # 👈 Retire la clé 'user' redondante
            user_data['prestataire_profile'] = profile_data

        # 5. Génération des tokens JWT
        refresh = RefreshToken.for_user(user)

        # 6. Réponse propre
        return Response(
            {
                'detail': 'Compte activé avec succès.',
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': user_data,
            },
            status=status.HTTP_200_OK,
        )

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = LogoutSerializer  # <-- ajoute ceci, indispensable pour drf_spectacular

    @extend_schema(
        tags=["Auth"],
        summary="Logout",
        description="Invalide le refresh token en le blacklistant.",
        request=LogoutSerializer,
        responses={
            205: OpenApiResponse(description="Déconnexion réussie."),
            400: OpenApiResponse(description="Refresh token invalide."),
            401: OpenApiResponse(description="Authentification requise."),
        },
    )
    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            token = RefreshToken(serializer.validated_data["refresh"])
            token.blacklist()
        except TokenError:
            return Response(
                {"detail": "Refresh token invalide ou déjà blacklisté."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(status=status.HTTP_205_RESET_CONTENT)


class UtilisateurViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Utilisateur.objects.all()
    serializer_class = UtilisateurSerializer
    permission_classes = [IsAuthenticated]


class PrestataireProfileViewSet(viewsets.ModelViewSet):
    queryset = PrestataireProfile.objects.select_related('user').all()

    def get_serializer_class(self):
        # Utilise le serializer d'inscription complet lors du POST
        if self.action == 'create':
            return PrestataireCreateSerializer
        return PrestataireProfileSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated()]


class SubscriptionViewSet(viewsets.ModelViewSet):
    queryset = Subscription.objects.all()
    serializer_class = SubscriptionSerializer
    permission_classes = [IsAuthenticated]


class NotesViewSet(viewsets.ModelViewSet):
    queryset = Notes.objects.select_related('author', 'prestataire').all()
    serializer_class = NotesSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Associe automatiquement l'utilisateur connecté comme auteur de la note
        serializer.save(author=self.request.user)
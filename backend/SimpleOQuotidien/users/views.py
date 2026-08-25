from rest_framework import viewsets, permissions, mixins
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from django.utils import timezone
from .models import Utilisateur, PrestataireProfile, PrestataireStatusChoices, Assignment, AssignmentStatusChoices, Subscription, Notes
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

from commandes.models import OrderStatusChoices
from notifications.services import (
    notifier_assignation_prestataire,
    notifier_attribution_client,
    notifier_reassignation_necessaire,
)
from .tasks import check_assignment_timeout

ASSIGNMENT_TIMEOUT_SECONDS = 30 * 60


class AssignmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer l'assignation d'un Prestataire à une Commande.
    Accessible principalement par les AGENTS et ADMINS.
    """

    serializer_class = AssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Assignment.objects.all().select_related('order', 'prestataire__user')
        user = self.request.user
        if user.role == RoleChoices.PRESTATAIRE:
            return qs.filter(prestataire__user=user)
        if user.role == RoleChoices.CLIENT:
            return qs.filter(order__client=user)
        return qs  # AGENT / ADMIN voient tout

    def perform_create(self, serializer):
        # 0. Un prestataire non encore validé (rejeté/suspendu) par l'administrateur
        # ne peut pas recevoir d'offre/assignation — le filtre côté frontend (agent)
        # n'est qu'un confort d'UI, la vraie garde doit être ici.
        prestataire = serializer.validated_data.get('prestataire')
        if prestataire is not None and prestataire.verification_status != PrestataireStatusChoices.VALIDE:
            raise PermissionDenied("Ce prestataire n'est pas encore validé par l'administrateur.")

        # 0bis. On ne peut plus (ré)assigner une commande déjà finalisée (terminée
        # ou annulée) : aucune écriture partielle ne doit avoir lieu dans ce cas.
        order = serializer.validated_data.get('order')
        if order is not None and order.status in (
            OrderStatusChoices.TERMINEE, OrderStatusChoices.ANNULEE,
        ):
            raise PermissionDenied('Cette commande est déjà finalisée : impossible de l’assigner.')

        # 1. Sauvegarde de l'assignation en associant l'agent connecté (qualifier)
        assignment = serializer.save(qualifier=self.request.user)

        # 1bis. Un agent doit pouvoir intervenir à tout moment (même sur une commande
        # déjà assignée) pour changer de prestataire. On neutralise alors les anciennes
        # assignations encore actives de cette commande : sans cela l'ancien prestataire
        # restait en mesure d'accepter/refuser une offre périmée, et la commande
        # paraissait "assignée" à l'agent sans qu'il ne puisse plus agir dessus.
        order.assignments.exclude(pk=assignment.pk).filter(
            status=AssignmentStatusChoices.EN_ATTENTE,
        ).update(status=AssignmentStatusChoices.EXPIREE, date_reponse=timezone.now())

        order.status = OrderStatusChoices.ASSIGNEE
        order.save(update_fields=['status'])

        # 2. Notification In-App + E-mail au Prestataire (avec le template provider_assignment.html)
        notifier_assignation_prestataire(assignment)

        # 3. Notification In-App + E-mail au Client (avec le template general_notification.html)
        notifier_attribution_client(assignment)

        # 4. Démarrage du timer de 30 minutes : réassignation automatique si le
        # prestataire ne répond pas à temps. Best-effort : si le broker Celery/Redis
        # est indisponible (ex. non provisionné en production), l'assignation — déjà
        # enregistrée et déjà notifiée aux deux parties — ne doit pas échouer pour autant
        # (c'était la cause de l'erreur 500 malgré l'envoi effectif des e-mails).
        try:
            check_assignment_timeout.apply_async(
                args=[assignment.id], countdown=ASSIGNMENT_TIMEOUT_SECONDS
            )
        except Exception:
            import logging
            logging.getLogger(__name__).warning(
                f"Échec de la planification du timeout pour l'assignation {assignment.id} "
                "(broker Celery indisponible ?)"
            )

    @action(detail=True, methods=['post'], url_path='accept')
    def accept(self, request, pk=None):
        assignment = self.get_object()
        if assignment.prestataire.user_id != request.user.id:
            return Response(
                {'detail': "Cette assignation ne vous concerne pas."}, status=403
            )
        if assignment.status != AssignmentStatusChoices.EN_ATTENTE:
            return Response(
                {'detail': 'Cette assignation a déjà été traitée.'}, status=400
            )
        assignment.status = AssignmentStatusChoices.ACCEPTEE
        assignment.date_reponse = timezone.now()
        assignment.save(update_fields=['status', 'date_reponse'])
        return Response(AssignmentSerializer(assignment).data)

    @action(detail=True, methods=['post'], url_path='refuse')
    def refuse(self, request, pk=None):
        assignment = self.get_object()
        if assignment.prestataire.user_id != request.user.id:
            return Response(
                {'detail': "Cette assignation ne vous concerne pas."}, status=403
            )
        if assignment.status != AssignmentStatusChoices.EN_ATTENTE:
            return Response(
                {'detail': 'Cette assignation a déjà été traitée.'}, status=400
            )
        assignment.status = AssignmentStatusChoices.REFUSEE
        assignment.motif_refus = request.data.get('reason', '')
        assignment.date_reponse = timezone.now()
        assignment.save(update_fields=['status', 'motif_refus', 'date_reponse'])

        assignment.order.status = OrderStatusChoices.A_REASSIGNER
        assignment.order.save(update_fields=['status'])

        notifier_reassignation_necessaire(assignment, motif='refus')
        return Response(AssignmentSerializer(assignment).data)

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


class UtilisateurViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """Lecture ouverte à tout utilisateur authentifié ; suppression réservée
    aux administrateurs (aucune modification n'est exposée côté admin)."""
    queryset = Utilisateur.objects.all()
    serializer_class = UtilisateurSerializer
    permission_classes = [IsAuthenticated]

    def perform_destroy(self, instance):
        if self.request.user.role != RoleChoices.ADMIN:
            raise PermissionDenied("Réservé aux administrateurs.")
        instance.delete()


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

    def perform_update(self, serializer):
        prestataire = self.get_object()
        user = self.request.user
        if prestataire.user_id != user.id and user.role not in (RoleChoices.AGENT, RoleChoices.ADMIN):
            raise PermissionDenied('Vous ne pouvez modifier que votre propre profil.')
        serializer.save()

    def _require_agent_or_admin(self, request):
        if request.user.role not in (RoleChoices.AGENT, RoleChoices.ADMIN):
            return Response(
                {'detail': "Réservé aux agents et administrateurs."}, status=403
            )
        return None

    @action(detail=True, methods=['post'])
    def validate(self, request, pk=None):
        denied = self._require_agent_or_admin(request)
        if denied:
            return denied
        prestataire = self.get_object()
        prestataire.verification_status = PrestataireStatusChoices.VALIDE
        prestataire.save(update_fields=['verification_status'])
        return Response(PrestataireProfileSerializer(prestataire).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        denied = self._require_agent_or_admin(request)
        if denied:
            return denied
        prestataire = self.get_object()
        prestataire.verification_status = PrestataireStatusChoices.REJETE
        prestataire.motif_statut = request.data.get('motif', '')
        prestataire.save(update_fields=['verification_status', 'motif_statut'])
        return Response(PrestataireProfileSerializer(prestataire).data)

    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        """Suspend un prestataire déjà validé (ex. VALIDE -> SUSPENDU). Un prestataire
        suspendu ne peut plus recevoir d'assignation (cf. AssignmentViewSet.perform_create)
        ni créer/modifier de service tant qu'il n'est pas revalidé."""
        denied = self._require_agent_or_admin(request)
        if denied:
            return denied
        prestataire = self.get_object()
        prestataire.verification_status = PrestataireStatusChoices.SUSPENDU
        prestataire.motif_statut = request.data.get('motif', '')
        prestataire.save(update_fields=['verification_status', 'motif_statut'])
        return Response(PrestataireProfileSerializer(prestataire).data)


class SubscriptionViewSet(viewsets.ModelViewSet):
    queryset = Subscription.objects.all()
    serializer_class = SubscriptionSerializer
    permission_classes = [IsAuthenticated]


class NotesViewSet(viewsets.ModelViewSet):
    queryset = Notes.objects.select_related('author', 'prestataire').all()
    serializer_class = NotesSerializer
    # Lecture publique (les notes/avis s'affichent sur les pages catalogue non
    # authentifiées côté client) ; création/modification/suppression réservées
    # aux utilisateurs connectés.
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        # Associe automatiquement l'utilisateur connecté comme auteur de la note
        serializer.save(author=self.request.user)
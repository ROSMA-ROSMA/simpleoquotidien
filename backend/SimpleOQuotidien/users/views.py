from rest_framework import viewsets, permissions
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Utilisateur, PrestataireProfile, Assignment, Subscription, Notes
from .serializers import (
    UtilisateurSerializer,
    PrestataireProfileSerializer,
    PrestataireCreateSerializer,
    AssignmentSerializer,
    SubscriptionSerializer,
    NotesSerializer,
)


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


class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated]


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
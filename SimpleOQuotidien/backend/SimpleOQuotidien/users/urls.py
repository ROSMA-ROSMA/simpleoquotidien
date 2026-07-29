from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import (
    UtilisateurViewSet,
    PrestataireProfileViewSet,
    AssignmentViewSet,
    SubscriptionViewSet,
    NotesViewSet,
    NotificationViewSet,
)

# Utilisation du DefaultRouter de DRF
router = DefaultRouter()
router.register('utilisateurs', UtilisateurViewSet, basename='utilisateur')
router.register('prestataires', PrestataireProfileViewSet, basename='prestataire')
router.register('assignments', AssignmentViewSet, basename='assignment')
router.register('subscriptions', SubscriptionViewSet, basename='subscription')
router.register('notes', NotesViewSet, basename='note')
router.register('notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
]
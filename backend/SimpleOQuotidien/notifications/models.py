from django.conf import settings
from django.db import models


class NotificationType(models.TextChoices):
    # Pour l'Agent
    QUOTE_REFUSED = 'QUOTE_REFUSED', 'Devis refusé - Réassignation requise'
    NEW_ORDER_CREATED = 'NEW_ORDER_CREATED', 'Nouvelle commande créée'
    REASSIGNMENT_NEEDED = 'REASSIGNMENT_NEEDED', 'Réassignation nécessaire'

    # Pour le Prestataire
    NEW_ASSIGNMENT = 'NEW_ASSIGNMENT', 'Nouvelle mission attribuée'
    QUOTE_ACCEPTED = 'QUOTE_ACCEPTED', 'Devis accepté par le client'

    # Pour le Client
    PRESTATAIRE_ASSIGNED = 'PRESTATAIRE_ASSIGNED', 'Nouveau prestataire attribué'
    NEW_QUOTE_RECEIVED = 'NEW_QUOTE_RECEIVED', 'Nouveau devis reçu'


class Notification(models.Model):
    destinataire = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    titre = models.CharField(max_length=255)
    message = models.TextField()
    type_notification = models.CharField(
        max_length=50, choices=NotificationType.choices
    )
    order = models.ForeignKey(
        'commandes.Order',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications',
    )
    est_lu = models.BooleanField(default=False)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_creation']

    def __str__(self):
        return f'{self.type_notification} ➔ {self.destinataire.email}'
from django.contrib.auth.models import AbstractUser
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


# --- ÉNUMÉRATIONS (CHOICES) ---

class RoleChoices(models.TextChoices):
    CLIENT = 'CLIENT', 'Client'
    PRESTATAIRE = 'PRESTATAIRE', 'Prestataire'
    AGENT = 'AGENT', 'Agent'
    ADMIN = 'ADMIN', 'Admin'


class PrestataireStatusChoices(models.TextChoices):
    EN_ATTENTE = 'EN_ATTENTE', 'En attente'
    VALIDE = 'VALIDE', 'Validé'
    REJETE = 'REJETE', 'Rejeté'
    SUSPENDU = 'SUSPENDU', 'Suspendu'


# --- MODÈLES ---

class Utilisateur(AbstractUser):
    email = models.EmailField(unique=True)
    username = models.CharField(blank=True, null=True, max_length=150, unique=True, default=None)
    role = models.CharField(max_length=20, choices=RoleChoices.choices, default=RoleChoices.CLIENT)
    pays = models.CharField(max_length=100)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username'] if username else []

    class Meta:
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"

    def __str__(self):
        return f"{self.get_full_name() or self.email} ({self.role})"


class PrestataireProfile(models.Model):
    # Relation OneToOne propre vers l'Utilisateur
    user = models.OneToOneField(
        Utilisateur, 
        on_delete=models.CASCADE, 
        related_name='prestataire_profile'
    )
    company_name = models.CharField(max_length=150)
    services = models.TextField()
    zones_couvertes = models.TextField()
    langue = models.CharField(max_length=100)
    tarif = models.CharField(max_length=100)
    verification_status = models.CharField(
        max_length=20, 
        choices=PrestataireStatusChoices.choices, 
        default=PrestataireStatusChoices.EN_ATTENTE
    )
    cni_passeport = models.FileField(upload_to='Prestataire/cni/')
    justificatif = models.FileField(upload_to='Prestataire/justificatifs/')
    photo = models.FileField(upload_to='Prestataire/photos/')
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Prestataire"
        verbose_name_plural = "Prestataires"
        ordering = ['-date_modification']

    def __str__(self):
        return self.company_name


class AssignmentStatusChoices(models.TextChoices):
    EN_ATTENTE = 'EN_ATTENTE', 'En attente de réponse'
    ACCEPTEE = 'ACCEPTEE', 'Acceptée'
    REFUSEE = 'REFUSEE', 'Refusée'
    EXPIREE = 'EXPIREE', 'Expirée (délai dépassé)'


class Assignment(models.Model):
    methode = models.CharField(max_length=100)
    order = models.ForeignKey('commandes.Order', on_delete=models.CASCADE, related_name='assignments')
    prestataire = models.ForeignKey(PrestataireProfile, on_delete=models.CASCADE, related_name='assignments_received')
    qualifier = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='assignments_qualified')
    status = models.CharField(max_length=20, choices=AssignmentStatusChoices.choices, default=AssignmentStatusChoices.EN_ATTENTE)
    motif_refus = models.TextField(blank=True, null=True)
    date_reponse = models.DateTimeField(blank=True, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    def __str__(self):
        # Si la commande a un attribut uuid
        if hasattr(self.order, 'uuid'):
            return f'Assignment #{self.id} - Commande {self.order.uuid}'
        # Alternative simple avec l'ID de la commande
        return f'Assignment #{self.id} - Commande #{self.order.id}'

class Payment(models.Model):
    order = models.OneToOneField('commandes.Order', on_delete=models.CASCADE, related_name='payment')
    montant = models.DecimalField(max_digits=10, decimal_places=2)
    statut = models.CharField(max_length=50)  # Ex: PAYE, EN_ATTENTE, ECHOUE
    transaction_id = models.CharField(max_length=100, unique=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    
    
class Subscription(models.Model):
    plan = models.IntegerField()
    statut = models.CharField(max_length=100)
    mode_payment = models.CharField(max_length=100)
    prestataire = models.ForeignKey(PrestataireProfile, on_delete=models.CASCADE, related_name='subscriptions')
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Subscription Plan {self.plan} - {self.statut}"


class Notes(models.Model):
    # Validation du nombre d'étoiles (entre 1 et 5)
    etoile = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    commentaire = models.TextField()
    prestataire = models.ForeignKey(PrestataireProfile, on_delete=models.CASCADE, related_name='notes')
    author = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='written_notes')
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Note"
        verbose_name_plural = "Notes"

    def __str__(self):
        return f"Note {self.etoile}* pour {self.prestataire.company_name} par {self.author.email}"
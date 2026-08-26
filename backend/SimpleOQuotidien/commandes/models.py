from django.db import models
import uuid

from SimpleOQuotidien.storage import get_raw_media_storage


class OrderStatusChoices(models.TextChoices):
    CREEE = 'CREEE', 'Créée'
    EN_TRAITEMENT = 'EN_TRAITEMENT', 'En traitement'
    ASSIGNEE = 'ASSIGNEE', 'Assignée'
    ACCEPTEE = 'ACCEPTEE', 'Acceptée'
    REFUSEE = 'REFUSEE', 'Refusée'
    REPORTEE = 'REPORTEE', 'Reportée'
    A_REASSIGNER = 'A_REASSIGNER', 'À réassigner'
    EN_COURS = 'EN_COURS', 'En cours'
    TERMINEE = 'TERMINEE', 'Terminée'
    ANNULEE = 'ANNULEE', 'Annulée'

class QuoteStatusChoices(models.TextChoices):
    ENVOYE = 'ENVOYE', 'Envoyé'
    ACCEPTE = 'ACCEPTE', 'Accepté'
    REFUSE = 'REFUSE', 'Refusé'
    

class Category(models.Model):
    nom = models.CharField(max_length=100)
    description = models.TextField()
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    date_creation = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    date_modification = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        ordering = ['nom']

    def __str__(self):
        return self.nom

class Order(models.Model):
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    status = models.CharField(max_length=50, choices=OrderStatusChoices.choices, default=OrderStatusChoices.CREEE)
    description = models.TextField()
    localisation = models.CharField(max_length=255)
    date = models.DateTimeField()
    budget = models.DecimalField(max_digits=10, decimal_places=2)
    images = models.ImageField(upload_to='orders/', blank=True, null=True)
    voice_note = models.FileField(upload_to='orders/voice_notes/', blank=True, null=True, storage=get_raw_media_storage)
    date_creation = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    date_modification = models.DateTimeField(auto_now=True, blank=True, null=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='orders')
    client = models.ForeignKey('users.Utilisateur', on_delete=models.CASCADE, related_name='orders')
    
    class Meta:
        ordering = ['-date_creation']
    
    def __str__(self):
        return f"Numero: {self.uuid}"


class Quote(models.Model):
    status = models.CharField(
        max_length=20, 
        choices=QuoteStatusChoices.choices, 
        default=QuoteStatusChoices.ENVOYE
    )
    description = models.TextField(
        blank=True, null=True
    )  # 👈 Description du devis
    pdf_file = models.FileField(
        upload_to='devis_pdf/', blank=True, null=True, storage=get_raw_media_storage
    )
    price = models.CharField(max_length=100)
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='quote')
    date_creation = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    date_modification = models.DateTimeField(auto_now=True, blank=True, null=True)
    def __str__(self):
        return f"Quote {self.id} for Order {self.order_id}"


class Service(models.Model):
    """Une prestation individuelle proposée par un prestataire (catalogue public)."""
    prestataire = models.ForeignKey(
        'users.PrestataireProfile', on_delete=models.CASCADE, related_name='catalogue_services'
    )
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='services')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    city = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='services/', blank=True, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_creation']

    def __str__(self):
        return f"{self.category.nom} - {self.prestataire.company_name}"
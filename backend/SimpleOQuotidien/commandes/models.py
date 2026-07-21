from django.db import models



class OrderStatusChoices(models.TextChoices):
    CREEE = 'CREEE', 'Créée'
    EN_TRAITEMENT = 'EN_TRAITEMENT', 'En traitement'
    ASSIGNEE = 'ASSIGNEE', 'Assignée'
    ACCEPTEE = 'ACCEPTEE', 'Acceptée'
    REFUSEE = 'REFUSEE', 'Refusée'
    REPORTEE = 'REPORTEE', 'Reportée'
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
    date_creation = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    date_modification = models.DateTimeField(auto_now=True, blank=True, null=True)
    def __str__(self):
        return self.nom
    
class Order(models.Model):
    status = models.CharField(max_length=50, choices=OrderStatusChoices.choices, default=OrderStatusChoices.CREEE)
    description = models.TextField()
    localisation = models.CharField(max_length=255)
    date = models.DateTimeField()
    budget = models.FloatField()
    images = models.ImageField(upload_to='orders/', blank=True, null=True)
    date_creation = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    date_modification = models.DateTimeField(auto_now=True, blank=True, null=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='orders')
    client = models.ForeignKey('users.Utilisateur', on_delete=models.CASCADE, related_name='orders')

    def __str__(self):
        return f"Order #{self.id} - {self.localisation}"


class Quote(models.Model):
    status = models.CharField(
        max_length=20, 
        choices=QuoteStatusChoices.choices, 
        default=QuoteStatusChoices.ENVOYE
    )
    price = models.CharField(max_length=100)
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='quote')
    date_creation = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    date_modification = models.DateTimeField(auto_now=True, blank=True, null=True)
    def __str__(self):
        return f"Quote {self.id} for Order {self.order_id}"
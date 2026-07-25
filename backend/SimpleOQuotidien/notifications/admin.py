from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.utils.translation import gettext_lazy as _
from unfold.admin import ModelAdmin
from .models import Notification


@admin.register(Notification)
class AssignmentAdmin(ModelAdmin):
    list_display = ('id', 'destinataire', 'titre', 'type_notification', 'order', 'date_creation')
    
    
    
    

from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    # Champ calculé pour afficher le libellé propre du type de notification
    type_notification_display = serializers.CharField(
        source='get_type_notification_display', read_only=True
    )

    class Meta:
        model = Notification
        fields = [
            'id',
            'titre',
            'message',
            'type_notification',
            'type_notification_display',
            'order',
            'est_lu',
            'date_creation',
        ]
        read_only_fields = [
            'id',
            'titre',
            'message',
            'type_notification',
            'type_notification_display',
            'order',
            'date_creation',
        ]
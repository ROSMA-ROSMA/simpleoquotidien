from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(destinataire=self.request.user)

    @action(detail=True, methods=['patch'], url_path='marquer-lu')
    def marquer_lu(self, request, pk=None):
        notif = self.get_object()
        notif.est_lu = True
        notif.save()
        return Response({'status': 'Notification marquée comme lue'})

    @action(detail=False, methods=['patch'], url_path='marquer-tout-lu')
    def marquer_tout_lu(self, request):
        self.get_queryset().filter(est_lu=False).update(est_lu=True)
        return Response({'status': 'Toutes les notifications sont lues'})
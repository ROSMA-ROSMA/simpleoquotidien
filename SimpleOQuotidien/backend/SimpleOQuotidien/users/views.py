from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status as http_status
from .models import (
    Utilisateur, PrestataireProfile, Assignment, Subscription, Notes, Notification,
    AssignmentStatusChoices, NotificationTypeChoices,
)
from .serializers import (
    UtilisateurSerializer,
    PrestataireProfileSerializer,
    PrestataireCreateSerializer,
    AssignmentSerializer,
    SubscriptionSerializer,
    NotesSerializer,
    NotificationSerializer,
)


class UtilisateurViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Utilisateur.objects.all()
    serializer_class = UtilisateurSerializer
    permission_classes = [IsAuthenticated]


class PrestataireProfileViewSet(viewsets.ModelViewSet):
    queryset = PrestataireProfile.objects.select_related('user').all()

    def get_serializer_class(self):
        if self.action == 'create':
            return PrestataireCreateSerializer
        return PrestataireProfileSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        """
        Accept flat multipart fields with dotted notation (user.email, user.password, etc.)
        and transform them into the nested dict that PrestataireCreateSerializer expects.
        """
        from rest_framework.response import Response
        from rest_framework import status as http_status

        # Convert QueryDict to a plain dict (QueryDict can't hold nested dicts)
        raw = request.data
        flat = {}
        user_data = {}

        for key in raw:
            val = raw[key]
            if key.startswith('user.'):
                user_data[key[5:]] = val
            else:
                flat[key] = val

        # Grab uploaded files explicitly
        for key in request.FILES:
            if not key.startswith('user.'):
                flat[key] = request.FILES[key]

        if user_data:
            flat['user'] = user_data

        serializer = self.get_serializer(data=flat)
        if not serializer.is_valid():
            # Flatten nested errors for a clear frontend message
            errors = serializer.errors
            flat_errors = {}
            for field, msgs in errors.items():
                if isinstance(msgs, dict):
                    for sub, sub_msgs in msgs.items():
                        flat_errors[sub] = sub_msgs
                else:
                    flat_errors[field] = msgs
            return Response(flat_errors, status=http_status.HTTP_400_BAD_REQUEST)

        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=http_status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['post'], url_path='validate')
    def validate_prestataire(self, request, pk=None):
        """Admin validates a prestataire: activate account + set status VALIDE."""
        from rest_framework.response import Response
        profile = self.get_object()
        profile.verification_status = 'VALIDE'
        profile.save(update_fields=['verification_status'])
        profile.user.is_active = True
        profile.user.save(update_fields=['is_active'])
        return Response({'status': 'validated', 'id': profile.id})

    @action(detail=True, methods=['post'], url_path='reject')
    def reject_prestataire(self, request, pk=None):
        """Admin rejects a prestataire: keep account inactive + set status SUSPENDU."""
        from rest_framework.response import Response
        profile = self.get_object()
        profile.verification_status = 'SUSPENDU'
        profile.save(update_fields=['verification_status'])
        profile.user.is_active = False
        profile.user.save(update_fields=['is_active'])
        return Response({'status': 'rejected', 'id': profile.id})


class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated]

    def _respond(self, request, assignment, new_status, order_status, notif_type, notif_title, notif_message, reason=''):
        if assignment.prestataire.user_id != request.user.id:
            return Response({'detail': "Cette commande n'est pas assignée à ce prestataire."}, status=http_status.HTTP_403_FORBIDDEN)
        if assignment.status != AssignmentStatusChoices.EN_ATTENTE:
            return Response({'detail': 'Cette assignation a déjà reçu une réponse.'}, status=http_status.HTTP_400_BAD_REQUEST)

        assignment.status = new_status
        if reason:
            assignment.reason = reason
        assignment.save(update_fields=['status', 'reason', 'date_modification'])

        order = assignment.order
        order.status = order_status
        order.save(update_fields=['status', 'date_modification'])

        Notification.objects.create(
            user=assignment.qualifier,
            type=notif_type,
            title=notif_title,
            message=notif_message,
            order=order,
        )

        return Response(AssignmentSerializer(assignment).data)

    @action(detail=True, methods=['post'], url_path='accept')
    def accept(self, request, pk=None):
        assignment = self.get_object()
        return self._respond(
            request, assignment,
            new_status=AssignmentStatusChoices.ACCEPTEE,
            order_status='ACCEPTEE',
            notif_type=NotificationTypeChoices.PROVIDER_RESPONSE,
            notif_title='Commande acceptée',
            notif_message=f"Le prestataire {assignment.prestataire.company_name} a accepté la commande #{assignment.order_id}.",
        )

    @action(detail=True, methods=['post'], url_path='refuse')
    def refuse(self, request, pk=None):
        assignment = self.get_object()
        reason = (request.data.get('reason') or '').strip()
        notif_message = f"Le prestataire {assignment.prestataire.company_name} a refusé la commande #{assignment.order_id}. Elle doit être réassignée."
        if reason:
            notif_message += f" Raison : {reason}"
        return self._respond(
            request, assignment,
            new_status=AssignmentStatusChoices.REFUSEE,
            order_status='REFUSEE',
            notif_type=NotificationTypeChoices.REASSIGNMENT_NEEDED,
            notif_title='Commande refusée',
            notif_message=notif_message,
            reason=reason,
        )


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({'status': 'ok'})


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
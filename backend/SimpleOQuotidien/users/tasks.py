from celery import shared_task
from django.utils import timezone


@shared_task
def check_assignment_timeout(assignment_id):
    """Réassigne automatiquement si le prestataire n'a pas répondu dans les 30 minutes."""
    from commandes.models import OrderStatusChoices
    from notifications.services import notifier_reassignation_necessaire
    from .models import Assignment, AssignmentStatusChoices

    try:
        assignment = Assignment.objects.select_related('order', 'prestataire').get(id=assignment_id)
    except Assignment.DoesNotExist:
        return

    if assignment.status != AssignmentStatusChoices.EN_ATTENTE:
        return  # Le prestataire a déjà répondu (accepté ou refusé) — rien à faire.

    assignment.status = AssignmentStatusChoices.EXPIREE
    assignment.date_reponse = timezone.now()
    assignment.save(update_fields=['status', 'date_reponse'])

    assignment.order.status = OrderStatusChoices.A_REASSIGNER
    assignment.order.save(update_fields=['status'])

    notifier_reassignation_necessaire(assignment, motif='timeout')

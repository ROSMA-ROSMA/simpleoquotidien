import os

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.urls import reverse

from commandes.tokens import generate_action_token
from .models import Notification, NotificationType

User = get_user_model()


def creer_notification_inapp(destinataire, titre, message, type_notif, order=None):
    """Enregistre une notification dans la BDD pour l'application."""
    return Notification.objects.create(
        destinataire=destinataire,
        titre=titre,
        message=message,
        type_notification=type_notif,
        order=order,
    )


def notifier_assignation_prestataire(assignment):
    """Notifie le Prestataire de son assignation (In-App + E-mail complet)."""
    order = assignment.order
    prestataire = assignment.prestataire
    destinataire = prestataire.user

    creer_notification_inapp(
        destinataire=destinataire,
        titre='Nouvelle assignation de mission',
        message=(
            f'Vous avez été assigné à la commande {order.uuid}'
            f' ({order.localisation}). Merci de consulter la demande et de répondre'
            ' sous 30 minutes.'
        ),
        type_notif=NotificationType.NEW_ASSIGNMENT,
        order=order,
    )

    if destinataire.email:
        provider_dashboard_url = f"{settings.FRONTEND_URL}/booking/{order.uuid}"
        context = {
            'prestataire': prestataire,
            'order': order,
            'assignment': assignment,
            'provider_dashboard_url': provider_dashboard_url,
        }
        html_content = render_to_string(
            'email/provider_assignment.html', context
        )

        msg = EmailMultiAlternatives(
            subject=f'Nouvelle mission assignée - Commande {order.uuid}',
            body=f'Vous avez été assigné à la commande {order.uuid}.',
            from_email=getattr(
                settings, 'DEFAULT_FROM_EMAIL', 'kamta.mariane1@icloud.com'
            ),
            to=[destinataire.email],
        )
        msg.attach_alternative(html_content, 'text/html')
        msg.send(fail_silently=False)


def notifier_attribution_client(assignment):
    """Notifie le Client qu'un prestataire a été assigné (In-App + E-mail)."""
    order = assignment.order
    client = order.client

    creer_notification_inapp(
        destinataire=client,
        titre='Un prestataire a été attribué',
        message=(
            f'Le prestataire {assignment.prestataire.company_name} a été'
            f' attribué à votre commande {order.uuid}.'
        ),
        type_notif=NotificationType.PRESTATAIRE_ASSIGNED,
        order=order,
    )

    if client.email:
        context = {
            'destinataire': client,
            'order': order,
            'titre': 'Un prestataire a été attribué',
            'message': (
                f'Le prestataire {assignment.prestataire.company_name} a été'
                f' attribué à votre commande {order.uuid}.'
            ),
        }
        html_content = render_to_string(
            'email/general_notification.html', context
        )

        msg = EmailMultiAlternatives(
            subject=f'Prestataire attribué pour votre commande {order.uuid}',
            body=f'Le prestataire {assignment.prestataire.company_name} a été attribué.',
            from_email=getattr(
                settings, 'DEFAULT_FROM_EMAIL', 'kamta.mariane1@icloud.com'
            ),
            to=[client.email],
        )
        msg.attach_alternative(html_content, 'text/html')
        msg.send(fail_silently=False)


def envoyer_notification_devis_client(request, quote):
    """Envoie au Client le devis avec les boutons d'action et le PDF joint."""
    order = quote.order
    client = order.client

    token_accept = generate_action_token(order.uuid, quote.id, 'ACCEPTER')
    token_refuse = generate_action_token(order.uuid, quote.id, 'REFUSER')

    domain = request.build_absolute_uri('/')[:-1]
    accept_url = (
        f"{domain}{reverse('direct-quote-action', kwargs={'token': token_accept})}"
    )
    refuse_url = (
        f"{domain}{reverse('direct-quote-action', kwargs={'token': token_refuse})}"
    )
    order_detail_url = f"{settings.FRONTEND_URL}/booking/{order.uuid}"

    creer_notification_inapp(
        destinataire=client,
        titre='Votre commande a été acceptée — devis reçu',
        message=(
            f'Le prestataire a accepté votre commande {order.uuid} et propose un'
            f' devis de {quote.price} FCFA. Consultez et validez-le depuis votre'
            ' espace.'
        ),
        type_notif=NotificationType.NEW_QUOTE_RECEIVED,
        order=order,
    )

    # La notification in-app est ce que le client voit réellement dans son
    # espace ; l'e-mail n'est qu'un canal complémentaire. Un souci d'e-mail
    # (SMTP indisponible sur Render, pièce jointe, etc.) ne doit donc pas faire
    # échouer l'envoi du devis côté prestataire (déjà bien enregistré en base
    # à ce stade) avec une 500 — on journalise et on continue.
    try:
        context = {
            'destinataire': client,
            'order': order,
            'quote': quote,
            'accept_url': accept_url,
            'refuse_url': refuse_url,
            'order_detail_url': order_detail_url,
        }

        html_content = render_to_string('email/quote_notification.html', context)

        msg = EmailMultiAlternatives(
            subject=f'Nouveau devis pour votre commande {order.uuid}',
            body=f'Bonjour, vous avez reçu un devis de {quote.price} FCFA.',
            from_email=getattr(
                settings, 'DEFAULT_FROM_EMAIL', 'kamta.mariane1@icloud.com'
            ),
            to=[client.email],
        )
        msg.attach_alternative(html_content, 'text/html')

        # Pièce jointe PDF si elle existe. `.path` n'est pas utilisable ici :
        # cette méthode suppose un fichier sur disque local et lève
        # NotImplementedError sur le storage Cloudinary utilisé en production.
        # On passe donc par l'API fichier de Django (open/read), qui
        # fonctionne avec n'importe quel storage.
        if hasattr(quote, 'pdf_file') and quote.pdf_file:
            quote.pdf_file.open('rb')
            try:
                msg.attach(
                    os.path.basename(quote.pdf_file.name),
                    quote.pdf_file.read(),
                    'application/pdf',
                )
            finally:
                quote.pdf_file.close()

        msg.send(fail_silently=False)
    except Exception:
        import logging
        logging.getLogger(__name__).warning(
            f"Échec envoi e-mail de notification de devis pour la commande {order.uuid}",
            exc_info=True,
        )


def notifier_acceptation_devis_prestataire(quote):
    """Notifie le prestataire que son devis a été accepté par le client."""
    order = quote.order
    if not (hasattr(order, 'assignments') and order.assignments.exists()):
        return

    # Assignment.Meta.ordering = ['-date_creation'] : le plus récent est le premier.
    prestataire_user = order.assignments.first().prestataire.user
    titre = f'Devis accepté - Commande {order.uuid}'
    message = f'Le client a accepté votre devis de {quote.price} FCFA.'

    creer_notification_inapp(
        destinataire=prestataire_user,
        titre=titre,
        message=message,
        type_notif=NotificationType.QUOTE_ACCEPTED,
        order=order,
    )

    if prestataire_user.email:
        context = {
            'destinataire': prestataire_user,
            'order': order,
            'quote': quote,
            'titre': titre,
            'message': message,
        }
        html_content = render_to_string(
            'email/general_notification.html', context
        )

        msg = EmailMultiAlternatives(
            subject=titre,
            body=message,
            from_email=getattr(
                settings, 'DEFAULT_FROM_EMAIL', 'kamta.mariane1@icloud.com'
            ),
            to=[prestataire_user.email],
        )
        msg.attach_alternative(html_content, 'text/html')
        msg.send(fail_silently=False)


def notifier_refus_devis_agents(quote):
    """Notifie les agents et administrateurs si le devis a été refusé."""
    order = quote.order
    agents = User.objects.filter(role__in=['AGENT', 'ADMIN'])

    titre = f'Devis refusé - Commande {order.uuid}'
    message = (
        f'Le client {order.client.email} a refusé le devis. Merci de lui'
        ' réassigner un nouveau prestataire.'
    )

    for agent in agents:
        creer_notification_inapp(
            destinataire=agent,
            titre=titre,
            message=message,
            type_notif=NotificationType.QUOTE_REFUSED,
            order=order,
        )

        if agent.email:
            context = {
                'destinataire': agent,
                'order': order,
                'quote': quote,
                'titre': titre,
                'message': message,
            }
            html_content = render_to_string(
                'email/general_notification.html', context
            )

            msg = EmailMultiAlternatives(
                subject=titre,
                body=message,
                from_email=getattr(
                    settings, 'DEFAULT_FROM_EMAIL', 'kamta.mariane1@icloud.com'
                ),
                to=[agent.email],
            )
            msg.attach_alternative(html_content, 'text/html')
            msg.send(fail_silently=False)


def notifier_reassignation_necessaire(assignment, motif='refus'):
    """Notifie les agents/admins qu'une commande doit être réassignée
    (refus explicite du prestataire ou non-réponse sous 30 minutes)."""
    order = assignment.order
    agents = User.objects.filter(role__in=['AGENT', 'ADMIN'])

    if motif == 'timeout':
        titre = f'Délai dépassé - Commande {order.uuid} à réassigner'
        message = (
            f"Le prestataire {assignment.prestataire.company_name} n'a pas répondu"
            ' dans le délai de 30 minutes. Merci de réassigner un nouveau'
            ' prestataire.'
        )
    else:
        raison = f' Motif : {assignment.motif_refus}' if assignment.motif_refus else ''
        titre = f'Prestataire refusé - Commande {order.uuid} à réassigner'
        message = (
            f'Le prestataire {assignment.prestataire.company_name} a refusé la'
            f' mission.{raison} Merci de réassigner un nouveau prestataire.'
        )

    for agent in agents:
        creer_notification_inapp(
            destinataire=agent,
            titre=titre,
            message=message,
            type_notif=NotificationType.REASSIGNMENT_NEEDED,
            order=order,
        )

        if agent.email:
            context = {
                'destinataire': agent,
                'order': order,
                'titre': titre,
                'message': message,
            }
            html_content = render_to_string(
                'email/general_notification.html', context
            )

            msg = EmailMultiAlternatives(
                subject=titre,
                body=message,
                from_email=getattr(
                    settings, 'DEFAULT_FROM_EMAIL', 'kamta.mariane1@icloud.com'
                ),
                to=[agent.email],
            )
            msg.attach_alternative(html_content, 'text/html')
            msg.send(fail_silently=False)


def notifier_validation_devis_agent(quote):
    """Notifie les agents/admins que le client a validé le devis proposé."""
    order = quote.order
    agents = User.objects.filter(role__in=['AGENT', 'ADMIN'])

    titre = f'Devis validé par le client - Commande {order.uuid}'
    message = (
        f'Le client {order.client.email} a validé le devis de {quote.price} FCFA.'
        ' Le prestataire va prendre contact avec lui.'
    )

    for agent in agents:
        creer_notification_inapp(
            destinataire=agent,
            titre=titre,
            message=message,
            type_notif=NotificationType.QUOTE_ACCEPTED,
            order=order,
        )

        if agent.email:
            context = {
                'destinataire': agent,
                'order': order,
                'quote': quote,
                'titre': titre,
                'message': message,
            }
            html_content = render_to_string(
                'email/general_notification.html', context
            )

            msg = EmailMultiAlternatives(
                subject=titre,
                body=message,
                from_email=getattr(
                    settings, 'DEFAULT_FROM_EMAIL', 'kamta.mariane1@icloud.com'
                ),
                to=[agent.email],
            )
            msg.attach_alternative(html_content, 'text/html')
            msg.send(fail_silently=False)
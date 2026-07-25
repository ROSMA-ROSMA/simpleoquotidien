from django.core.signing import BadSignature, SignatureExpired, TimestampSigner

signer = TimestampSigner()


def generate_action_token(order_uuid, quote_id, action):
    """Génère un token sécurisé à partir de l'UUID de la commande."""
    data_str = f'{order_uuid}:{quote_id}:{action}'
    return signer.sign(data_str)


def verify_action_token(token, max_age=86400 * 7):  # Valide 7 jours
    """Vérifie le token et extrait l'UUID de la commande."""
    try:
        data_str = signer.unsign(token, max_age=max_age)
        parts = data_str.split(':')

        if len(parts) != 3:
            return None

        return {
            'order_uuid': str(
                parts[0]
            ),  # Garantit que c'est une string UUID
            'quote_id': int(parts[1]),
            'action': parts[2],
        }
    except (SignatureExpired, BadSignature, ValueError):
        return None
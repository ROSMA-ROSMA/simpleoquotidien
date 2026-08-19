from rest_framework.exceptions import AuthenticationFailed
from rest_framework.views import exception_handler as drf_exception_handler


def custom_exception_handler(exc, context):
    """Ajoute un champ `code` (ex. 'email_not_confirmed') à la réponse JSON des erreurs
    d'authentification, en plus du `detail` humain — pour que le frontend puisse
    distinguer par exemple un mot de passe incorrect d'un compte pas encore confirmé
    sans avoir à analyser le texte du message."""
    response = drf_exception_handler(exc, context)
    if response is not None and isinstance(exc, AuthenticationFailed):
        code = exc.get_codes()
        if isinstance(code, str):
            response.data['code'] = code
    return response

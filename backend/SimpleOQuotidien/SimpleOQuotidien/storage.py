import os

from django.core.files.storage import FileSystemStorage
from whitenoise.storage import CompressedManifestStaticFilesStorage


def get_raw_media_storage():
    """Stockage pour les fichiers non-image (PDF, notes vocales) uploadés sur Cloudinary.

    Le storage par défaut (`MediaCloudinaryStorage`, utilisé par les `STORAGES['default']`)
    force `resource_type='image'` pour tous les uploads. Cloudinary restreint par défaut la
    delivery des PDF/ZIP via ce resource_type pour raisons de sécurité, ce qui renvoie une
    404 sur les documents (CNI/justificatif prestataire, PDF de devis) même correctement
    uploadés — alors que les vraies images (photos de service, de catégorie...) s'affichent
    sans problème. Le resource_type 'raw' n'a pas cette restriction et convient aussi bien
    aux PDF qu'aux notes vocales. Callable (plutôt qu'instance figée au chargement du
    module) pour rester cohérent avec le choix Cloudinary/disque local fait dynamiquement
    dans `settings.STORAGES`."""
    if os.environ.get('CLOUDINARY_URL'):
        from cloudinary_storage.storage import RawMediaCloudinaryStorage
        return RawMediaCloudinaryStorage()
    return FileSystemStorage()


class SilentFileMissingCompressedManifestStorage(CompressedManifestStaticFilesStorage):
    """CompressedManifestStaticFilesStorage tolérant aux références statiques
    manquantes (ex. `rest_framework/css/bootstrap.min.css.map`, un sourcemap
    que django-rest-framework référence dans son CSS embarquée mais ne
    distribue pas dans le paquet pip). Sans cette surcharge, `collectstatic`
    lève une `ValueError` pour ce fichier cosmétique absent et fait échouer
    tout le build/déploiement. On se contente ici de garder le nom original
    non hashé pour la référence introuvable au lieu de planter."""

    def hashed_name(self, name, content=None, filename=None):
        try:
            return super().hashed_name(name, content, filename)
        except ValueError:
            return name

    def compress_files(self, paths):
        # Sur certains fichiers CSS/JS réécrits (url() internes) en plusieurs
        # passes, le nom "d'origine" suivi pour la compression ne correspond
        # parfois à aucun fichier réellement présent sur disque (seule la
        # version hashée existe) : on filtre ces entrées fantômes au lieu de
        # planter sur un FileNotFoundError pendant la compression gzip/brotli.
        existing_paths = [path for path in paths if self.exists(path)]
        return super().compress_files(existing_paths)

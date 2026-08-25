from whitenoise.storage import CompressedManifestStaticFilesStorage


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

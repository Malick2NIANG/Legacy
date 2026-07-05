"""
Service de stockage objet via MinIO (compatible S3).
Gère l'upload, le téléchargement et la suppression de fichiers.
"""
import io
from datetime import timedelta
from minio import Minio
from minio.error import S3Error
from app.core.config import settings


class StorageService:
    def __init__(self):
        self.client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=False,
        )
        self.bucket = settings.MINIO_BUCKET
        self.models_bucket = settings.MINIO_MODELS_BUCKET
        self._ensure_bucket(self.bucket)
        self._ensure_bucket(self.models_bucket)

    def _ensure_bucket(self, bucket_name: str):
        """Crée le bucket s'il n'existe pas."""
        try:
            if not self.client.bucket_exists(bucket_name):
                self.client.make_bucket(bucket_name)
        except S3Error:
            pass  # bucket peut déjà exister en cas de race condition

    def upload(self, file_data: bytes, object_name: str, content_type: str) -> str:
        """Upload un fichier dans le bucket datasets et retourne la clé MinIO."""
        self.client.put_object(
            bucket_name=self.bucket,
            object_name=object_name,
            data=io.BytesIO(file_data),
            length=len(file_data),
            content_type=content_type,
        )
        return object_name

    def upload_model(self, file_data: bytes, object_name: str, content_type: str) -> str:
        """Upload un fichier modèle dans le bucket models et retourne la clé MinIO."""
        self.client.put_object(
            bucket_name=self.models_bucket,
            object_name=object_name,
            data=io.BytesIO(file_data),
            length=len(file_data),
            content_type=content_type,
        )
        return object_name

    def get_url(self, object_name: str, expires: int = 3600) -> str:
        """Génère une URL présignée (usage interne uniquement)."""
        return self.client.presigned_get_object(
            bucket_name=self.bucket,
            object_name=object_name,
            expires=timedelta(seconds=expires),
        )

    def get_object_stream(self, object_name: str):
        """Retourne un stream depuis le bucket datasets (pour proxy téléchargement)."""
        return self.client.get_object(self.bucket, object_name)

    def get_model_stream(self, object_name: str):
        """Retourne un stream du fichier modèle.
        Rétrocompatible : les anciennes clés 'models/...' vivent dans le bucket datasets,
        les nouvelles clés sans préfixe vivent dans le bucket models.
        """
        if object_name.startswith("models/"):
            # Ancien format (avant séparation des buckets) : datasets/models/...
            return self.client.get_object(self.bucket, object_name)
        # Nouveau format : models/experiment_X_...pkl
        return self.client.get_object(self.models_bucket, object_name)

    def delete(self, object_name: str):
        """Supprime un objet du bucket datasets."""
        try:
            self.client.remove_object(self.bucket, object_name)
        except S3Error:
            pass  # silencieux si l'objet n'existe pas

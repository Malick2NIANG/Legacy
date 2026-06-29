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
        self._ensure_bucket()

    def _ensure_bucket(self):
        """Crée le bucket par défaut s'il n'existe pas."""
        try:
            if not self.client.bucket_exists(self.bucket):
                self.client.make_bucket(self.bucket)
        except S3Error:
            pass  # bucket peut déjà exister en cas de race condition

    def upload(self, file_data: bytes, object_name: str, content_type: str) -> str:
        """Upload un fichier et retourne la clé MinIO."""
        self.client.put_object(
            bucket_name=self.bucket,
            object_name=object_name,
            data=io.BytesIO(file_data),
            length=len(file_data),
            content_type=content_type,
        )
        return object_name

    def get_url(self, object_name: str, expires: int = 3600) -> str:
        """Génère une URL présignée pour accès temporaire au fichier."""
        return self.client.presigned_get_object(
            bucket_name=self.bucket,
            object_name=object_name,
            expires=timedelta(seconds=expires),
        )

    def delete(self, object_name: str):
        """Supprime un objet du bucket."""
        try:
            self.client.remove_object(self.bucket, object_name)
        except S3Error:
            pass  # silencieux si l'objet n'existe pas

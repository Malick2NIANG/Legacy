"""
Configuration centralisée de l'application via variables d'environnement.
Utilise Pydantic BaseSettings pour la validation et le chargement depuis .env.
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "Legacy, Plateforme Data Science"
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    DATABASE_URL: str = "postgresql://user:password@localhost:5432/ds_platform"
    REDIS_URL: str = "redis://localhost:6379/0"

    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET: str = "datasets"

    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]

    # Email (SMTP), pour la réinitialisation de mot de passe
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@legacy-platform.io"
    FRONTEND_URL: str = "http://localhost:3000"

    HF_API_KEY: str = ""

    class Config:
        env_file = ".env"


settings = Settings()

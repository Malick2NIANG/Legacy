"""
Configuration de l'application Celery.
Définit le broker (Redis) et le backend de résultats pour les tâches asynchrones.
"""
from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "ds_platform",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.workers.tasks.train_task", "app.workers.tasks.export_task"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
)

"""
Schémas Pydantic pour la validation des expériences ML.
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.experiment import ExperimentStatus


class ExperimentCreate(BaseModel):
    """Données pour lancer une nouvelle expérience."""
    name: str
    dataset_id: int
    model_id: int


class ExperimentRead(BaseModel):
    """Représentation complète d'une expérience."""
    id: int
    name: str
    dataset_id: int
    model_id: int
    status: ExperimentStatus
    celery_task_id: Optional[str]
    created_at: datetime
    finished_at: Optional[datetime]

    class Config:
        from_attributes = True

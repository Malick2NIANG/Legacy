"""
Schemas Pydantic pour la validation des experiences ML.
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.experiment import ExperimentStatus


class ExperimentCreate(BaseModel):
    """Donnees pour lancer une nouvelle experience."""
    name: str
    dataset_id: int
    model_id: int


class ExperimentRead(BaseModel):
    """Representation complete d'une experience."""
    id: int
    name: str
    dataset_id: int
    model_id: int
    dataset_name: Optional[str] = None
    model_name: Optional[str] = None
    status: ExperimentStatus
    celery_task_id: Optional[str] = None
    created_at: datetime
    finished_at: Optional[datetime] = None

    class Config:
        from_attributes = True

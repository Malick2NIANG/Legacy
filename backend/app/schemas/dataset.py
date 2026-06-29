"""
Schémas Pydantic pour la validation des données dataset.
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class DatasetCreate(BaseModel):
    """Métadonnées soumises avec l'upload d'un dataset."""
    name: str


class DatasetRead(BaseModel):
    """Représentation complète d'un dataset retournée au client."""
    id: int
    name: str
    filename: str
    file_size: Optional[int]
    mimetype: Optional[str]
    owner_id: int
    created_at: datetime

    class Config:
        from_attributes = True

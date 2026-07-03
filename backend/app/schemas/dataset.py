"""
Schemas Pydantic pour la validation des donnees dataset.
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class DatasetCreate(BaseModel):
    """Metadonnees soumises avec l'upload d'un dataset."""
    name: str


class DatasetRead(BaseModel):
    """Representation complete d'un dataset retournee au client."""
    id: int
    name: str
    filename: str
    minio_key: Optional[str]
    file_size: Optional[int]
    mimetype: Optional[str]
    owner_id: int
    created_at: datetime
    version: Optional[int] = 1

    class Config:
        from_attributes = True

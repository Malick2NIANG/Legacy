"""
Schémas Pydantic pour la validation des configurations de modèles ML.
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any


class ModelCreate(BaseModel):
    """Données pour créer une configuration de modèle."""
    name: str
    algorithm: str
    hyperparameters: Dict[str, Any] = {}


class ModelUpdate(BaseModel):
    """Données pour modifier une configuration existante."""
    name: Optional[str] = None
    hyperparameters: Optional[Dict[str, Any]] = None


class ModelRead(BaseModel):
    """Représentation complète d'un modèle retournée au client."""
    id: int
    name: str
    algorithm: str
    hyperparameters: Dict[str, Any]
    owner_id: int
    created_at: datetime

    class Config:
        from_attributes = True

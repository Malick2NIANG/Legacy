"""
Schémas Pydantic pour la validation et la sérialisation des résultats ML.
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any


class ResultRead(BaseModel):
    """Métriques complètes d'une expérience terminée."""
    id: int
    experiment_id: int
    accuracy: Optional[float]
    precision: Optional[float]
    recall: Optional[float]
    f1_score: Optional[float]
    confusion_matrix: Optional[List[List[int]]]
    training_history: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True

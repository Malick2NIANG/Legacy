"""
Service de gestion des configurations de modèles ML.
CRUD sur les modèles avec vérification de propriété.
"""
from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.model import Model


class ModelService:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self, owner_id: int) -> List[Model]:
        """Retourne tous les modèles de l'utilisateur."""
        return (
            self.db.query(Model)
            .filter(Model.owner_id == owner_id)
            .order_by(Model.created_at.desc())
            .all()
        )

    def get_by_id(self, model_id: int, owner_id: int) -> Model:
        """Retourne un modèle par ID avec vérification de propriété."""
        m = self.db.query(Model).filter(Model.id == model_id).first()
        if not m:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Modèle introuvable")
        if m.owner_id != owner_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
        return m

    def create(self, name: str, algorithm: str, hyperparameters: dict, owner_id: int) -> Model:
        """Crée et persiste une nouvelle configuration de modèle."""
        m = Model(name=name, algorithm=algorithm, hyperparameters=hyperparameters, owner_id=owner_id)
        self.db.add(m)
        self.db.commit()
        self.db.refresh(m)
        return m

    def update(self, model_id: int, owner_id: int, **kwargs) -> Model:
        """Met à jour les champs spécifiés d'un modèle existant."""
        m = self.get_by_id(model_id, owner_id)
        for key, value in kwargs.items():
            if value is not None:
                setattr(m, key, value)
        self.db.commit()
        self.db.refresh(m)
        return m

    def delete(self, model_id: int, owner_id: int) -> Model:
        """Supprime un modèle par ID."""
        m = self.get_by_id(model_id, owner_id)
        self.db.delete(m)
        self.db.commit()
        return m

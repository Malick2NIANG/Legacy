"""
Service de gestion des configurations de modeles ML.
"""
from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.model import Model


class ModelService:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self, owner_id: int) -> List[Model]:
        return (
            self.db.query(Model)
            .filter(Model.owner_id == owner_id)
            .order_by(Model.created_at.desc())
            .all()
        )

    def get_by_id(self, model_id: int, owner_id: int) -> Model:
        m = self.db.query(Model).filter(Model.id == model_id).first()
        if not m:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Modele introuvable")
        if m.owner_id != owner_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acces refuse")
        return m

    def create(
        self,
        name: str,
        owner_id: int,
        description: str = None,
        model_type: str = "sklearn",
        algorithm: str = None,
        hf_model_id: str = None,
        cv_task: str = None,
        version: str = "v1 - initial",
        hyperparameters: dict = None,
    ) -> Model:
        m = Model(
            name=name,
            description=description,
            model_type=model_type,
            algorithm=algorithm,
            hf_model_id=hf_model_id,
            cv_task=cv_task,
            version=version,
            hyperparameters=hyperparameters or {},
            owner_id=owner_id,
        )
        self.db.add(m)
        self.db.commit()
        self.db.refresh(m)
        return m

    def update(self, model_id: int, owner_id: int, **kwargs) -> Model:
        m = self.get_by_id(model_id, owner_id)
        for key, value in kwargs.items():
            if value is not None:
                setattr(m, key, value)
        self.db.commit()
        self.db.refresh(m)
        return m

    def delete(self, model_id: int, owner_id: int) -> Model:
        m = self.get_by_id(model_id, owner_id)
        self.db.delete(m)
        self.db.commit()
        return m

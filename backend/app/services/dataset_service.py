"""
Service de gestion des datasets.
Coordonne l'upload vers MinIO et la persistance des métadonnées en DB.
"""
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.dataset import Dataset


class DatasetService:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self, owner_id: int) -> List[Dataset]:
        """Retourne tous les datasets appartenant à l'utilisateur."""
        return (
            self.db.query(Dataset)
            .filter(Dataset.owner_id == owner_id)
            .order_by(Dataset.created_at.desc())
            .all()
        )

    def get_by_id(self, dataset_id: int, owner_id: int) -> Optional[Dataset]:
        """Retourne un dataset par son ID si l'utilisateur en est propriétaire."""
        dataset = self.db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if not dataset:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset introuvable")
        if dataset.owner_id != owner_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
        return dataset

    def get_next_version(self, name: str, owner_id: int) -> int:
        """Retourne le prochain numéro de version pour un dataset donné."""
        from sqlalchemy import func as sqlfunc
        existing_max = (
            self.db.query(sqlfunc.max(Dataset.version))
            .filter(Dataset.owner_id == owner_id, Dataset.name == name)
            .scalar()
        )
        return (existing_max or 0) + 1

    def create(
        self,
        name: str,
        filename: str,
        minio_key: str,
        owner_id: int,
        file_size: int = None,
        mimetype: str = None,
        version: int = None,
    ) -> Dataset:
        """Enregistre les métadonnées d'un dataset après upload réussi vers MinIO.
        Auto-incrémente la version si un dataset du même nom existe déjà."""
        if version is None:
            from sqlalchemy import func as sqlfunc
            existing_max = (
                self.db.query(sqlfunc.max(Dataset.version))
                .filter(Dataset.owner_id == owner_id, Dataset.name == name)
                .scalar()
            )
            version = (existing_max or 0) + 1

        dataset = Dataset(
            name=name,
            filename=filename,
            minio_key=minio_key,
            owner_id=owner_id,
            file_size=file_size,
            mimetype=mimetype,
            version=version,
        )
        self.db.add(dataset)
        self.db.commit()
        self.db.refresh(dataset)
        return dataset

    def delete(self, dataset_id: int, owner_id: int) -> Dataset:
        """Supprime le dataset de la DB (le fichier MinIO est géré par l'endpoint)."""
        dataset = self.get_by_id(dataset_id, owner_id)
        self.db.delete(dataset)
        self.db.commit()
        return dataset

"""
Endpoints de gestion des configurations de modèles ML.
CRUD des définitions de modèles (algorithme + hyperparamètres).
"""
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.services.model_service import ModelService

router = APIRouter()


# ── Schémas inline (simples, pas besoin de fichier séparé) ─────────────────
class ModelCreate(BaseModel):
    name: str
    algorithm: str
    hyperparameters: dict = {}


class ModelUpdate(BaseModel):
    name: Optional[str] = None
    hyperparameters: Optional[dict] = None


class ModelRead(BaseModel):
    id: int
    name: str
    algorithm: str
    hyperparameters: dict

    class Config:
        from_attributes = True


# ── Endpoints ───────────────────────────────────────────────────────────────
@router.get("/", response_model=List[ModelRead])
def list_models(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Retourne tous les modèles configurés par l'utilisateur."""
    return ModelService(db).get_all(owner_id=current_user.id)


@router.post("/", response_model=ModelRead, status_code=status.HTTP_201_CREATED)
def create_model(
    payload: ModelCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Crée une nouvelle configuration de modèle ML."""
    return ModelService(db).create(
        name=payload.name,
        algorithm=payload.algorithm,
        hyperparameters=payload.hyperparameters,
        owner_id=current_user.id,
    )


@router.put("/{model_id}", response_model=ModelRead)
def update_model(
    model_id: int,
    payload: ModelUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Met à jour le nom ou les hyperparamètres d'un modèle existant."""
    return ModelService(db).update(
        model_id=model_id,
        owner_id=current_user.id,
        name=payload.name,
        hyperparameters=payload.hyperparameters,
    )


@router.delete("/{model_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_model(
    model_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Supprime un modèle par ID."""
    ModelService(db).delete(model_id=model_id, owner_id=current_user.id)

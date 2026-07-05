"""
Endpoints de gestion des configurations de modeles ML.
"""
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.services.model_service import ModelService

router = APIRouter()


class ModelCreate(BaseModel):
    name: str
    description: Optional[str] = None
    model_type: str = "sklearn"
    algorithm: Optional[str] = "random_forest"
    hf_model_id: Optional[str] = None
    cv_task: Optional[str] = None
    version: Optional[str] = "v1 - initial"
    hyperparameters: dict = {}


class ModelUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    hyperparameters: Optional[dict] = None


class ModelRead(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    model_type: str = "sklearn"
    algorithm: Optional[str] = None
    hf_model_id: Optional[str] = None
    cv_task: Optional[str] = None
    version: Optional[str] = None
    hyperparameters: dict

    class Config:
        from_attributes = True


@router.get("/", response_model=List[ModelRead])
def list_models(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return ModelService(db).get_all(owner_id=current_user.id)


@router.post("/", response_model=ModelRead, status_code=status.HTTP_201_CREATED)
def create_model(payload: ModelCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return ModelService(db).create(
        name=payload.name,
        description=payload.description,
        model_type=payload.model_type,
        algorithm=payload.algorithm,
        hf_model_id=payload.hf_model_id,
        cv_task=payload.cv_task,
        version=payload.version,
        hyperparameters=payload.hyperparameters,
        owner_id=current_user.id,
    )


@router.put("/{model_id}", response_model=ModelRead)
def update_model(model_id: int, payload: ModelUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return ModelService(db).update(
        model_id=model_id,
        owner_id=current_user.id,
        name=payload.name,
        description=payload.description,
        hyperparameters=payload.hyperparameters,
    )


@router.delete("/{model_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_model(model_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    ModelService(db).delete(model_id=model_id, owner_id=current_user.id)


@router.get("/{model_id}/download-model")
def download_model_pkl(
    model_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Stream le fichier modele (.pkl/.h5/.pt) depuis MinIO — pas de presigned URL."""
    from fastapi.responses import StreamingResponse
    from app.models.experiment import Experiment, ExperimentStatus
    from app.models.result import Result
    from app.services.storage_service import StorageService

    exp = (
        db.query(Experiment)
        .filter(
            Experiment.model_id == model_id,
            Experiment.owner_id == current_user.id,
            Experiment.status == ExperimentStatus.COMPLETED,
        )
        .order_by(Experiment.finished_at.desc())
        .first()
    )
    if not exp:
        raise HTTPException(status_code=404, detail="Aucune experience terminee pour ce modele")

    result = db.query(Result).filter(Result.experiment_id == exp.id).first()
    if not result or not result.model_key:
        raise HTTPException(
            status_code=404,
            detail="Modele non disponible — relancez une experience pour generer le fichier",
        )

    storage = StorageService()
    try:
        stream   = storage.get_model_stream(result.model_key)
        filename = result.model_key.split("/")[-1]
        return StreamingResponse(
            stream,
            media_type="application/octet-stream",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur de téléchargement : {e}")

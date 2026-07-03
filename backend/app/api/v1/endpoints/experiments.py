"""
Endpoints de gestion des experiences ML.
Lance les entrainements via Celery et expose le statut des taches asynchrones.
"""
from typing import List
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.experiment import Experiment, ExperimentStatus
from app.models.dataset import Dataset
from app.models.model import Model
from app.schemas.experiment import ExperimentCreate, ExperimentRead

router = APIRouter()


def _enrich(exp: Experiment, db: Session) -> dict:
    """Ajoute dataset_name et model_name a l'experience."""
    d = db.query(Dataset).filter(Dataset.id == exp.dataset_id).first()
    m = db.query(Model).filter(Model.id == exp.model_id).first()
    return {
        "id":             exp.id,
        "name":           exp.name,
        "dataset_id":     exp.dataset_id,
        "model_id":       exp.model_id,
        "dataset_name":   d.name if d else None,
        "model_name":     m.name if m else None,
        "status":         exp.status,
        "celery_task_id": exp.celery_task_id,
        "created_at":     exp.created_at,
        "finished_at":    exp.finished_at,
    }


@router.get("/", response_model=List[ExperimentRead])
def list_experiments(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Retourne toutes les experiences de l'utilisateur, les plus recentes en premier."""
    exps = (
        db.query(Experiment)
        .filter(Experiment.owner_id == current_user.id)
        .order_by(Experiment.created_at.desc())
        .all()
    )
    return [_enrich(e, db) for e in exps]


@router.post("/", response_model=ExperimentRead, status_code=status.HTTP_201_CREATED)
def launch_experiment(
    payload: ExperimentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Cree une experience en DB, declenche la tache Celery d'entrainement."""
    from app.workers.tasks.train_task import train_model

    exp = Experiment(
        name=payload.name,
        dataset_id=payload.dataset_id,
        model_id=payload.model_id,
        owner_id=current_user.id,
        status=ExperimentStatus.PENDING,
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)

    task = train_model.delay(exp.id)
    exp.celery_task_id = task.id
    exp.status = ExperimentStatus.RUNNING
    db.commit()
    db.refresh(exp)

    return _enrich(exp, db)


@router.get("/{experiment_id}", response_model=ExperimentRead)
def get_experiment(
    experiment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Retourne le detail d'une experience."""
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experience introuvable")
    if exp.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acces refuse")
    return _enrich(exp, db)


@router.get("/{experiment_id}/status")
def get_experiment_status(
    experiment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Retourne le statut courant d'une experience (pour polling frontend)."""
    from celery.result import AsyncResult
    from app.workers.celery_app import celery_app

    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp or exp.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experience introuvable")

    celery_status = None
    step = None
    if exp.celery_task_id:
        result = AsyncResult(exp.celery_task_id, app=celery_app)
        celery_status = result.state
        if result.info and isinstance(result.info, dict):
            step = result.info.get("step")

    return {
        "experiment_id": exp.id,
        "status":        exp.status,
        "celery_status": celery_status,
        "step":          step,
    }


@router.delete("/{experiment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_experiment(
    experiment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Supprime une experience et ses resultats associes."""
    from app.models.result import Result

    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experience introuvable")
    if exp.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acces refuse")

    # Supprimer le resultat associe d'abord (FK)
    db.query(Result).filter(Result.experiment_id == experiment_id).delete()
    db.delete(exp)
    db.commit()

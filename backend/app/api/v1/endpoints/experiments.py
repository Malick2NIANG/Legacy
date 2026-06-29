"""
Endpoints de gestion des expériences ML.
Lance les entraînements via Celery et expose le statut des tâches asynchrones.
"""
from typing import List
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.experiment import Experiment, ExperimentStatus
from app.schemas.experiment import ExperimentCreate, ExperimentRead

router = APIRouter()


@router.get("/", response_model=List[ExperimentRead])
def list_experiments(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Retourne toutes les expériences de l'utilisateur, les plus récentes en premier."""
    return (
        db.query(Experiment)
        .filter(Experiment.owner_id == current_user.id)
        .order_by(Experiment.created_at.desc())
        .all()
    )


@router.post("/", response_model=ExperimentRead, status_code=status.HTTP_201_CREATED)
def launch_experiment(
    payload: ExperimentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Crée une expérience en DB, déclenche la tâche Celery d'entraînement."""
    from app.workers.tasks.train_task import train_model

    # Créer l'expérience avec statut PENDING
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

    # Lancer la tâche Celery de façon asynchrone
    task = train_model.delay(exp.id)
    exp.celery_task_id = task.id
    exp.status = ExperimentStatus.RUNNING
    db.commit()
    db.refresh(exp)

    return exp


@router.get("/{experiment_id}", response_model=ExperimentRead)
def get_experiment(
    experiment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Retourne le détail d'une expérience."""
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expérience introuvable")
    if exp.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    return exp


@router.get("/{experiment_id}/status")
def get_experiment_status(
    experiment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Retourne le statut courant d'une expérience (pour polling frontend)."""
    from celery.result import AsyncResult
    from app.workers.celery_app import celery_app

    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp or exp.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expérience introuvable")

    celery_status = None
    if exp.celery_task_id:
        result = AsyncResult(exp.celery_task_id, app=celery_app)
        celery_status = result.state

    return {
        "experiment_id": exp.id,
        "status": exp.status,
        "celery_status": celery_status,
    }

"""
Endpoints de recuperation et d export des resultats d experiences.
Fournit les metriques, la matrice de confusion et les exports CSV/JSON.
"""
import csv
import io
import json
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.api.deps import get_db, get_current_user
from app.models.result import Result
from app.models.experiment import Experiment
from app.models.dataset import Dataset
from app.models.model import Model
from app.services.storage_service import StorageService

router = APIRouter()


class ResultRead(BaseModel):
    id: int
    experiment_id: int
    accuracy: Optional[float]
    precision: Optional[float]
    recall: Optional[float]
    f1_score: Optional[float]
    confusion_matrix: Optional[list]
    training_history: Optional[dict]
    model_key: Optional[str] = None

    class Config:
        from_attributes = True


def _get_result_or_404(experiment_id: int, owner_id: int, db: Session) -> Result:
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp or exp.owner_id != owner_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experience introuvable")
    result = db.query(Result).filter(Result.experiment_id == experiment_id).first()
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resultats non disponibles - experience pas encore terminee",
        )
    return result


@router.get("/{experiment_id}/download-model")
def download_model(
    experiment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Stream le fichier modele (.pkl/.h5/.pt) depuis MinIO — pas de presigned URL."""
    from fastapi.responses import StreamingResponse
    result = _get_result_or_404(experiment_id, current_user.id, db)
    if not result.model_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Modele non disponible — relancez l'experience pour generer le fichier.",
        )
    storage = StorageService()
    try:
        stream   = storage.get_object_stream(result.model_key)
        filename = result.model_key.split("/")[-1]
        return StreamingResponse(
            stream,
            media_type="application/octet-stream",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur de téléchargement : {e}")


@router.get("/{experiment_id}", response_model=ResultRead)
def get_results(
    experiment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Retourne les metriques completes d une experience terminee."""
    return _get_result_or_404(experiment_id, current_user.id, db)


@router.get("/{experiment_id}/export")
def export_results(
    experiment_id: int,
    format: str = Query("json", regex="^(json|csv|csv_history)$"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Exporte les resultats.
    - format=csv          : resume complet (1 ligne) avec metadonnees + metriques
    - format=csv_history  : historique d entrainement epoch par epoch
    - format=json         : tout en JSON
    """
    result = _get_result_or_404(experiment_id, current_user.id, db)

    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    dataset = db.query(Dataset).filter(Dataset.id == exp.dataset_id).first() if exp else None
    model = db.query(Model).filter(Model.id == exp.model_id).first() if exp else None

    duration_s = None
    if exp and exp.created_at and exp.finished_at:
        duration_s = int((exp.finished_at - exp.created_at).total_seconds())

    cm = result.confusion_matrix or []
    cm_flat = {}
    if cm:
        for i, row in enumerate(cm):
            for j, val in enumerate(row):
                cm_flat[f"cm_{i}_{j}"] = val

    history = result.training_history or {}

    if format == "csv":
        row = {
            "experiment_id":   experiment_id,
            "experiment_name": exp.name if exp else "",
            "dataset":         dataset.name if dataset else "",
            "model":           model.name if model else "",
            "model_type":      model.model_type if model else "",
            "status":          exp.status if exp else "",
            "created_at":      exp.created_at.isoformat() if exp and exp.created_at else "",
            "finished_at":     exp.finished_at.isoformat() if exp and exp.finished_at else "",
            "duration_s":      duration_s if duration_s is not None else "",
            "accuracy":        round(result.accuracy * 100, 4) if result.accuracy is not None else "",
            "precision":       round(result.precision * 100, 4) if result.precision is not None else "",
            "recall":          round(result.recall * 100, 4) if result.recall is not None else "",
            "f1_score":        round(result.f1_score * 100, 4) if result.f1_score is not None else "",
        }
        row.update(cm_flat)
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=list(row.keys()))
        writer.writeheader()
        writer.writerow(row)
        output.seek(0)
        return StreamingResponse(
            output,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=results_{experiment_id}.csv"},
        )

    if format == "csv_history":
        if not history:
            raise HTTPException(status_code=404, detail="Historique d entrainement non disponible")
        keys = list(history.keys())
        n_epochs = len(history[keys[0]]) if keys else 0
        output = io.StringIO()
        fieldnames = ["epoch"] + keys
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        for epoch in range(n_epochs):
            row = {"epoch": epoch + 1}
            for k in keys:
                v = history[k][epoch]
                row[k] = round(v, 6) if isinstance(v, float) else v
            writer.writerow(row)
        output.seek(0)
        return StreamingResponse(
            output,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=history_{experiment_id}.csv"},
        )

    data = {
        "experiment": {
            "id":          experiment_id,
            "name":        exp.name if exp else None,
            "dataset":     dataset.name if dataset else None,
            "model":       model.name if model else None,
            "model_type":  model.model_type if model else None,
            "status":      str(exp.status) if exp else None,
            "created_at":  exp.created_at.isoformat() if exp and exp.created_at else None,
            "finished_at": exp.finished_at.isoformat() if exp and exp.finished_at else None,
            "duration_s":  duration_s,
        },
        "metrics": {
            "accuracy":  result.accuracy,
            "precision": result.precision,
            "recall":    result.recall,
            "f1_score":  result.f1_score,
        },
        "confusion_matrix": cm,
        "training_history": history,
    }
    return StreamingResponse(
        io.BytesIO(json.dumps(data, indent=2).encode()),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=results_{experiment_id}.json"},
    )

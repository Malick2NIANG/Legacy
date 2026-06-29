"""
Endpoints de récupération et d'export des résultats d'expériences.
Fournit les métriques, la matrice de confusion et les exports CSV/JSON.
"""
import csv
import io
import json
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from app.api.deps import get_db, get_current_user
from app.models.result import Result
from app.models.experiment import Experiment

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

    class Config:
        from_attributes = True


def _get_result_or_404(experiment_id: int, owner_id: int, db: Session) -> Result:
    """Helper : vérifie l'ownership de l'expérience et retourne le résultat."""
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp or exp.owner_id != owner_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expérience introuvable")
    result = db.query(Result).filter(Result.experiment_id == experiment_id).first()
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Résultats non disponibles — l'expérience n'est peut-être pas encore terminée"
        )
    return result


@router.get("/{experiment_id}", response_model=ResultRead)
def get_results(
    experiment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Retourne les métriques complètes d'une expérience terminée."""
    return _get_result_or_404(experiment_id, current_user.id, db)


@router.get("/{experiment_id}/export")
def export_results(
    experiment_id: int,
    format: str = "json",
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Exporte les résultats au format json ou csv."""
    result = _get_result_or_404(experiment_id, current_user.id, db)

    data = {
        "experiment_id": result.experiment_id,
        "accuracy": result.accuracy,
        "precision": result.precision,
        "recall": result.recall,
        "f1_score": result.f1_score,
    }

    if format == "csv":
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=data.keys())
        writer.writeheader()
        writer.writerow(data)
        output.seek(0)
        return StreamingResponse(
            output,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=results_{experiment_id}.csv"},
        )

    # Défaut : JSON
    return StreamingResponse(
        io.BytesIO(json.dumps(data, indent=2).encode()),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=results_{experiment_id}.json"},
    )

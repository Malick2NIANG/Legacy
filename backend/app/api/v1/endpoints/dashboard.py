"""
Endpoints du tableau de bord utilisateur.
Fournit les statistiques personnelles et l'activité récente.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.dataset import Dataset
from app.models.model import Model
from app.models.experiment import Experiment, ExperimentStatus
from app.models.result import Result

router = APIRouter()


@router.get("/stats")
def user_dashboard_stats(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Statistiques personnelles de l'utilisateur connecté."""
    uid = current_user.id

    datasets_count    = db.query(Dataset).filter(Dataset.owner_id == uid).count()
    models_count      = db.query(Model).filter(Model.owner_id == uid).count()
    experiments_count = db.query(Experiment).filter(Experiment.owner_id == uid).count()

    # Résultats = expériences terminées avec un résultat
    exp_ids = [
        e.id for e in db.query(Experiment.id)
        .filter(Experiment.owner_id == uid).all()
    ]
    results_count = db.query(Result).filter(Result.experiment_id.in_(exp_ids)).count() if exp_ids else 0

    # Dernières expériences (5)
    recent_exps = (
        db.query(Experiment)
        .filter(Experiment.owner_id == uid)
        .order_by(Experiment.created_at.desc())
        .limit(5)
        .all()
    )

    return {
        "counts": {
            "datasets":    datasets_count,
            "models":      models_count,
            "experiments": experiments_count,
            "results":     results_count,
        },
        "recent_experiments": [
            {
                "id":         e.id,
                "name":       e.name,
                "status":     e.status,
                "created_at": e.created_at.isoformat() if e.created_at else None,
                "dataset_id": e.dataset_id,
                "model_id":   e.model_id,
            }
            for e in recent_exps
        ],
        # Onboarding : quelles étapes sont complétées
        "onboarding": {
            "has_dataset":    datasets_count > 0,
            "has_model":      models_count > 0,
            "has_experiment":  experiments_count > 0,
            "has_result":     results_count > 0,
        },
    }

"""
Endpoints d'administration.
Réservés aux utilisateurs avec is_admin=True.
Gestion des comptes : liste, promotion admin, désactivation.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from pydantic import BaseModel

from app.api.deps import get_db, require_admin
from app.models.user import User
from app.schemas.user import UserRead

router = APIRouter()


# ── Schémas locaux ─────────────────────────────────────────────────────────────

class UserAdminRead(UserRead):
    """Schéma étendu pour la vue admin (inclut is_admin)."""
    pass  # is_admin déjà dans UserRead


class RoleUpdate(BaseModel):
    is_admin: bool


class StatusUpdate(BaseModel):
    is_active: bool


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("/users", response_model=List[UserAdminRead])
def list_users(
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Retourne la liste complète des utilisateurs (admins uniquement)."""
    return db.query(User).order_by(User.created_at.desc()).all()


@router.patch("/users/{user_id}/role", response_model=UserAdminRead)
def update_role(
    user_id: int,
    payload: RoleUpdate,
    db: Session = Depends(get_db),
    current_admin=Depends(require_admin),
):
    """
    Promeut ou rétrograde un utilisateur.
    Un admin ne peut pas rétrograder son propre compte.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    if user.id == current_admin.id and not payload.is_admin:
        raise HTTPException(
            status_code=400,
            detail="Vous ne pouvez pas retirer vos propres droits admin",
        )
    user.is_admin = payload.is_admin
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}/status", response_model=UserAdminRead)
def update_status(
    user_id: int,
    payload: StatusUpdate,
    db: Session = Depends(get_db),
    current_admin=Depends(require_admin),
):
    """
    Active ou désactive un compte utilisateur.
    Un admin ne peut pas désactiver son propre compte.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    if user.id == current_admin.id and not payload.is_active:
        raise HTTPException(
            status_code=400,
            detail="Vous ne pouvez pas désactiver votre propre compte",
        )
    user.is_active = payload.is_active
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(require_admin),
):
    """Supprime définitivement un compte. Impossible sur son propre compte."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    if user.id == current_admin.id:
        raise HTTPException(
            status_code=400,
            detail="Vous ne pouvez pas supprimer votre propre compte",
        )
    db.delete(user)
    db.commit()


@router.get("/stats")
def platform_stats(
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Statistiques globales de la plateforme + activité récente."""
    from app.models.dataset import Dataset
    from app.models.model import Model
    from app.models.experiment import Experiment, ExperimentStatus

    total_users        = db.query(User).count()
    active_users       = db.query(User).filter(User.is_active == True).count()
    admin_count        = db.query(User).filter(User.is_admin == True).count()
    total_datasets     = db.query(Dataset).count()
    total_models       = db.query(Model).count()
    total_experiments  = db.query(Experiment).count()
    running_experiments = db.query(Experiment).filter(
        Experiment.status == ExperimentStatus.RUNNING
    ).count()

    # 5 derniers inscrits
    recent_users = db.query(User).order_by(User.created_at.desc()).limit(5).all()

    # 5 dernières expériences toutes plateformes
    recent_exps = (
        db.query(Experiment)
        .order_by(Experiment.created_at.desc())
        .limit(5)
        .all()
    )
    # Récupérer les emails des owners
    owner_ids = {e.owner_id for e in recent_exps}
    owners = {u.id: u for u in db.query(User).filter(User.id.in_(owner_ids)).all()}

    return {
        "users": {
            "total":  total_users,
            "active": active_users,
            "admins": admin_count,
        },
        "datasets":             total_datasets,
        "models":               total_models,
        "experiments":          total_experiments,
        "running_experiments":  running_experiments,
        "recent_users": [
            {
                "id":         u.id,
                "full_name":  u.full_name,
                "email":      u.email,
                "is_admin":   u.is_admin,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in recent_users
        ],
        "recent_experiments": [
            {
                "id":         e.id,
                "name":       e.name,
                "status":     e.status,
                "owner_name": owners.get(e.owner_id, {}).full_name if owners.get(e.owner_id) else "—",
                "owner_email": owners.get(e.owner_id, {}).email if owners.get(e.owner_id) else "—",
                "created_at": e.created_at.isoformat() if e.created_at else None,
            }
            for e in recent_exps
        ],
    }


@router.get("/demographics")
def demographics(
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    """Statistiques démographiques des utilisateurs pour les graphiques admin."""

    def group_by(col):
        rows = db.query(col, func.count(User.id)).group_by(col).all()
        return [{"label": k or "Non précisé", "count": v} for k, v in rows]

    # Usage reasons — JSON array, on déplie
    all_reasons = db.query(User.usage_reasons).filter(User.usage_reasons.isnot(None)).all()
    usage_counts: dict = {}
    for (reasons,) in all_reasons:
        if isinstance(reasons, list):
            for r in reasons:
                usage_counts[r] = usage_counts.get(r, 0) + 1

    total = db.query(User).count()
    with_profile = db.query(User).filter(User.country.isnot(None)).count()

    return {
        "total_users":    total,
        "with_profile":   with_profile,
        "countries":      group_by(User.country),
        "genders":        group_by(User.gender),
        "age_ranges":     group_by(User.age_range),
        "ml_levels":      group_by(User.ml_level),
        "discovery":      group_by(User.discovery_source),
        "usage_reasons":  sorted(
            [{"label": k, "count": v} for k, v in usage_counts.items()],
            key=lambda x: -x["count"],
        ),
    }

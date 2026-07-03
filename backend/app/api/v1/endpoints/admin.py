"""
Endpoints d'administration avec systeme double-approbation.
- Si 1 seul admin actif  -> actions directes
- Si 2+ admins actifs    -> actions sensibles creent une demande en attente
Actions sensibles : promote, demote, delete (admin)
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from pydantic import BaseModel

from app.api.deps import get_db, require_admin
from app.models.user import User
from app.models.admin_action import AdminAction
from app.models.audit_log import AuditLog
from app.schemas.user import UserRead

router = APIRouter()


# -- Schemas ------------------------------------------------------------------

class RoleUpdate(BaseModel):
    is_admin: bool

class StatusUpdate(BaseModel):
    is_active: bool
    reason: Optional[str] = None

class ActionDecision(BaseModel):
    reason: Optional[str] = None

class UserAdminCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    # password généré automatiquement, pas fourni par le formulaire

class UserAdminUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None


# -- Helpers ------------------------------------------------------------------

def active_admin_count(db: Session) -> int:
    return db.query(User).filter(User.is_admin == True, User.is_active == True).count()

def needs_approval(db: Session) -> bool:
    return active_admin_count(db) >= 2

def get_user_or_404(db: Session, user_id: int) -> User:
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    return u

def create_action(db: Session, action_type: str, target: User, requester: User) -> AdminAction:
    action = AdminAction(
        action_type=action_type,
        target_user_id=target.id,
        target_email=target.email,
        target_name=target.full_name or target.email,
        requested_by_id=requester.id,
        status="pending",
    )
    db.add(action)
    db.commit()
    db.refresh(action)
    return action

def execute_action(db: Session, action: AdminAction):
    target = db.query(User).filter(User.id == action.target_user_id).first()
    if not target:
        return
    if action.action_type == "promote":
        target.is_admin  = True
        target.is_active = True
        db.commit()
    elif action.action_type == "demote":
        target.is_admin = False
        db.commit()
    elif action.action_type == "activate_user":
        target.is_active = True
        db.commit()
    elif action.action_type == "deactivate_user":
        target.is_active = False
        db.commit()
    elif action.action_type == "delete":
        db.delete(target)
        db.commit()

def log_audit(
    db: Session,
    admin: User,
    action_type: str,
    target: Optional[User] = None,
    target_email: Optional[str] = None,
    target_name: Optional[str] = None,
    details: Optional[dict] = None,
):
    """Enregistre une action admin dans le journal d'audit."""
    entry = AuditLog(
        admin_id=admin.id,
        admin_email=admin.email,
        admin_name=admin.full_name or admin.email,
        action_type=action_type,
        target_user_id=target.id if target else None,
        target_email=(target.email if target else None) or target_email,
        target_name=(target.full_name or target.email if target else None) or target_name,
        details=details,
    )
    db.add(entry)
    db.commit()


# -- Utilisateurs -------------------------------------------------------------

@router.get("/users", response_model=List[UserRead])
def list_users(db: Session = Depends(get_db), _admin=Depends(require_admin)):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.post("/users", response_model=UserRead, status_code=201)
def create_user(
    payload: UserAdminCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    import secrets, string
    from app.services.auth_service import AuthService
    from app.core.security import hash_password
    from app.services.email_service import send_temp_password_email

    # Vérifier si l'email est déjà utilisé par un compte existant
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=409, detail="Un compte avec cet email existe déjà.")

    # Vérifier si une demande de promotion est déjà en attente pour cet email
    existing_action = db.query(AdminAction).filter(
        AdminAction.target_email == payload.email,
        AdminAction.action_type == "promote",
        AdminAction.status == "pending",
    ).first()
    if existing_action:
        raise HTTPException(status_code=409, detail="Une demande de création est déjà en attente pour cet email.")

    # Générer un mot de passe temporaire sécurisé
    alphabet = string.ascii_letters + string.digits + "!@#$%"
    temp_pw = (
        secrets.choice(string.ascii_uppercase)
        + secrets.choice(string.ascii_lowercase)
        + secrets.choice(string.digits)
        + secrets.choice("!@#$%")
        + "".join(secrets.choice(alphabet) for _ in range(6))
    )

    # Créer le compte avec mot de passe temporaire
    user = AuthService(db).create_user(
        email=payload.email,
        password=temp_pw,
        first_name=payload.first_name,
        last_name=payload.last_name,
    )
    user.must_change_password = True
    db.commit()
    db.refresh(user)

    if not needs_approval(db):
        # Seul admin → promotion directe + envoi email immédiat
        user.is_admin = True
        db.commit()
        db.refresh(user)
        try:
            send_temp_password_email(
                to_email=user.email,
                temp_password=temp_pw,
                user_name=user.first_name or user.full_name or "",
            )
        except Exception:
            pass
        log_audit(db, current_admin, "create_user", target=user, details={"email": payload.email, "direct_admin": True})
    else:
        # Plusieurs admins → demande d'approbation, email envoyé à l'approbation
        action = create_action(db, "promote", user, current_admin)
        # Stocker le mdp temp chiffré dans les détails pour l'envoyer à l'approbation
        action.details = {"is_new_user": True, "temp_pw": temp_pw}
        db.commit()
        log_audit(db, current_admin, "create_user", target=user, details={"email": payload.email, "pending_action_id": action.id})

    return user


@router.patch("/users/{user_id}/details", response_model=UserRead)
def update_user_details(
    user_id: int,
    payload: UserAdminUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    user = get_user_or_404(db, user_id)
    changes = {}
    if payload.first_name is not None:
        changes["first_name"] = payload.first_name
        user.first_name = payload.first_name
        user.full_name  = f"{payload.first_name} {user.last_name or ''}".strip()
    if payload.last_name is not None:
        changes["last_name"] = payload.last_name
        user.last_name = payload.last_name
        user.full_name = f"{user.first_name or ''} {payload.last_name}".strip()
    if payload.email is not None:
        existing = db.query(User).filter(User.email == payload.email, User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=409, detail="Cet email est deja utilise.")
        changes["email"] = payload.email
        user.email = payload.email
    if payload.is_active is not None:
        changes["is_active"] = payload.is_active
        user.is_active = payload.is_active
    db.commit()
    db.refresh(user)
    log_audit(db, current_admin, "edit_user", target=user, details={"changes": changes})
    return user


@router.patch("/users/{user_id}/role")
def update_role(
    user_id: int,
    payload: RoleUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    target = get_user_or_404(db, user_id)
    if target.id == current_admin.id and not payload.is_admin:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas retirer vos propres droits admin.")
    action_type = "promote" if payload.is_admin else "demote"
    if not needs_approval(db):
        target.is_admin = payload.is_admin
        db.commit()
        db.refresh(target)
        log_audit(db, current_admin, action_type, target=target, details={"direct": True})
        return {"direct": True, "user": UserRead.from_orm(target)}
    existing = db.query(AdminAction).filter(
        AdminAction.target_user_id == user_id,
        AdminAction.action_type == action_type,
        AdminAction.status == "pending",
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Une demande similaire est deja en attente.")
    action = create_action(db, action_type, target, current_admin)
    log_audit(db, current_admin, f"{action_type}_requested", target=target, details={"action_id": action.id})
    return {"pending": True, "action_id": action.id}


@router.patch("/users/{user_id}/status")
def update_status(
    user_id: int,
    payload: StatusUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    target = get_user_or_404(db, user_id)
    if target.id == current_admin.id and not payload.is_active:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas desactiver votre propre compte.")
    action_type = "activate_user" if payload.is_active else "deactivate_user"

    if not needs_approval(db):
        prev_status = target.is_active
        target.is_active = payload.is_active
        db.commit()
        db.refresh(target)
        details_log = {"previous": prev_status, "direct": True}
        if payload.reason: details_log["reason"] = payload.reason
        log_audit(db, current_admin, action_type, target=target, details=details_log)
        return {"direct": True, "user": UserRead.from_orm(target)}

    # Plusieurs admins → demande d'approbation
    existing = db.query(AdminAction).filter(
        AdminAction.target_user_id == user_id,
        AdminAction.action_type == action_type,
        AdminAction.status == "pending",
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Une demande similaire est déjà en attente.")

    action = create_action(db, action_type, target, current_admin)
    if payload.reason:
        action.details = {"reason": payload.reason}
        db.commit()
    details_log = {"action_id": action.id}
    if payload.reason: details_log["reason"] = payload.reason
    log_audit(db, current_admin, f"{action_type}_requested", target=target, details=details_log)
    return {"pending": True, "action_id": action.id}


@router.post("/users/{user_id}/reset-password", status_code=200)
def reset_user_password(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    import secrets, string
    from app.core.security import hash_password
    from app.services.email_service import send_temp_password_email

    target = get_user_or_404(db, user_id)
    if target.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Utilisez les paramètres de votre propre compte.")

    alphabet = string.ascii_letters + string.digits + "!@#$%"
    temp_pw = (
        secrets.choice(string.ascii_uppercase)
        + secrets.choice(string.ascii_lowercase)
        + secrets.choice(string.digits)
        + secrets.choice("!@#$%")
        + "".join(secrets.choice(alphabet) for _ in range(6))
    )
    target.hashed_password = hash_password(temp_pw)
    target.must_change_password = True
    db.commit()

    try:
        send_temp_password_email(
            to_email=target.email,
            temp_password=temp_pw,
            user_name=target.first_name or target.full_name or "",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mot de passe réinitialisé mais email non envoyé : {e}")

    log_audit(db, current_admin, "edit_user", target=target, details={"reset_password": True})
    return {"message": "Mot de passe réinitialisé et envoyé par email."}


@router.delete("/users/{user_id}", status_code=200)
def delete_user(
    user_id: int,
    reason: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    target = get_user_or_404(db, user_id)
    if target.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas supprimer votre propre compte.")
    if not target.is_admin or not needs_approval(db):
        target_email = target.email
        target_name  = target.full_name or target.email
        target_id    = target.id
        db.delete(target)
        db.commit()
        # log apres suppression (target n'existe plus en DB)
        details_log = {"direct": True}
        if reason: details_log["reason"] = reason
        entry = AuditLog(
            admin_id=current_admin.id,
            admin_email=current_admin.email,
            admin_name=current_admin.full_name or current_admin.email,
            action_type="delete_user",
            target_user_id=target_id,
            target_email=target_email,
            target_name=target_name,
            details=details_log,
        )
        db.add(entry)
        db.commit()
        return {"direct": True, "message": "Compte supprime."}
    existing = db.query(AdminAction).filter(
        AdminAction.target_user_id == user_id,
        AdminAction.action_type == "delete",
        AdminAction.status == "pending",
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Une demande de suppression est deja en attente.")
    action = create_action(db, "delete", target, current_admin)
    if reason:
        action.details = {"reason": reason}
        db.commit()
    log_audit(db, current_admin, "delete_requested", target=target, details={"action_id": action.id, **({"reason": reason} if reason else {})})
    return {"pending": True, "action_id": action.id}


# -- Actions en attente -------------------------------------------------------

@router.get("/actions")
def list_actions(db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    actions = db.query(AdminAction).order_by(AdminAction.created_at.desc()).all()
    requester_ids = {a.requested_by_id for a in actions if a.requested_by_id}
    requesters = {u.id: u for u in db.query(User).filter(User.id.in_(requester_ids)).all()}
    result = []
    for a in actions:
        req = requesters.get(a.requested_by_id)
        result.append({
            "id": a.id,
            "action_type": a.action_type,
            "target_user_id": a.target_user_id,
            "target_email": a.target_email,
            "target_name": a.target_name,
            "requested_by_id": a.requested_by_id,
            "requested_by_email": req.email if req else None,
            "requested_by_name": req.full_name if req else None,
            "approved_by_id": a.approved_by_id,
            "status": a.status,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "resolved_at": a.resolved_at.isoformat() if a.resolved_at else None,
            "details":      a.details,
            "can_approve": a.status == "pending" and a.requested_by_id != current_admin.id and a.target_user_id != current_admin.id,
        })
    return result


@router.post("/actions/{action_id}/approve")
def approve_action(action_id: int, db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    action = db.query(AdminAction).filter(AdminAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action introuvable.")
    if action.status != "pending":
        raise HTTPException(status_code=400, detail="Cette action n'est plus en attente.")
    if action.requested_by_id == current_admin.id:
        raise HTTPException(status_code=403, detail="Vous ne pouvez pas approuver votre propre demande.")
    if action.target_user_id == current_admin.id:
        raise HTTPException(status_code=403, detail="Vous ne pouvez pas approuver une action qui vous concerne.")
    details     = action.details or {}
    is_new_user = details.get("is_new_user", False)
    temp_pw     = details.get("temp_pw")

    action.approved_by_id = current_admin.id
    action.status         = "approved"
    action.resolved_at    = datetime.now(timezone.utc)
    db.commit()
    execute_action(db, action)

    # Si c'est un nouvel admin créé via le formulaire → envoyer l'email de bienvenue
    if is_new_user and temp_pw:
        target = db.query(User).filter(User.id == action.target_user_id).first()
        if target:
            from app.services.email_service import send_temp_password_email
            try:
                send_temp_password_email(
                    to_email=target.email,
                    temp_password=temp_pw,
                    user_name=target.first_name or target.full_name or "",
                )
            except Exception:
                pass

    log_audit(db, current_admin, "approve_action",
        target_email=action.target_email,
        target_name=action.target_name,
        details={"action_id": action_id, "action_type": action.action_type})
    return {"message": "Action approuvee et executee."}


@router.post("/actions/{action_id}/reject")
def reject_action(action_id: int, payload: ActionDecision = None, db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    from fastapi import Body
    if payload is None:
        payload = ActionDecision()
    action = db.query(AdminAction).filter(AdminAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action introuvable.")
    if action.status != "pending":
        raise HTTPException(status_code=400, detail="Cette action n'est plus en attente.")
    if action.requested_by_id == current_admin.id:
        raise HTTPException(status_code=403, detail="Vous ne pouvez pas rejeter votre propre demande.")
    if action.target_user_id == current_admin.id:
        raise HTTPException(status_code=403, detail="Vous ne pouvez pas rejeter une action qui vous concerne.")
    action.status = "rejected"
    action.resolved_at = datetime.now(timezone.utc)
    db.commit()
    details_log = {"action_id": action_id, "action_type": action.action_type}
    if payload.reason: details_log["reason"] = payload.reason
    log_audit(db, current_admin, "reject_action",
        target_email=action.target_email,
        target_name=action.target_name,
        details=details_log)
    return {"message": "Action rejetee."}


# -- Journal d'audit ----------------------------------------------------------

ACTION_LABELS = {
    "create_user":               "Compte créé",
    "edit_user":                 "Profil modifié",
    "promote":                   "Promu administrateur",
    "promote_requested":         "Promotion demandée",
    "demote":                    "Rétrogradé membre",
    "demote_requested":          "Rétrogradation demandée",
    "activate_user":             "Compte activé",
    "activate_user_requested":   "Activation demandée",
    "deactivate_user":           "Compte suspendu",
    "deactivate_user_requested": "Suspension demandée",
    "delete_user":               "Compte supprimé",
    "delete_requested":          "Suppression demandee",
    "approve_action":            "Action approuvee",
    "reject_action":             "Action rejetee",
}

@router.get("/audit")
def get_audit_logs(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    action_type: Optional[str] = None,
    admin_email: Optional[str] = None,
    target_email: Optional[str] = None,
):
    q = db.query(AuditLog)
    if action_type:   q = q.filter(AuditLog.action_type == action_type)
    if admin_email:   q = q.filter(AuditLog.admin_email.ilike(f"%{admin_email}%"))
    if target_email:  q = q.filter(AuditLog.target_email.ilike(f"%{target_email}%"))
    total = q.count()
    logs = q.order_by(AuditLog.created_at.desc()).offset((page-1)*per_page).limit(per_page).all()
    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "items": [
            {
                "id":           log.id,
                "admin_email":  log.admin_email,
                "admin_name":   log.admin_name,
                "action_type":  log.action_type,
                "action_label": ACTION_LABELS.get(log.action_type, log.action_type),
                "target_email": log.target_email,
                "target_name":  log.target_name,
                "details":      log.details,
                "created_at":   log.created_at.isoformat() if log.created_at else None,
            }
            for log in logs
        ],
    }


# -- Statistiques (demographics + plateforme) ---------------------------------

from app.models.dataset    import Dataset
from app.models.model      import Model
from app.models.experiment import Experiment
from app.models.result     import Result


@router.get("/demographics")
def get_demographics(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    """Stats demographiques des utilisateurs non-admin."""
    base = db.query(User).filter(User.is_admin == False)

    def count_col(col):
        rows = base.with_entities(col, func.count().label("n")).group_by(col).all()
        return [{"label": r[0] or "Non precise", "count": r[1]} for r in rows if r[0]]

    reasons_raw = [u.usage_reasons for u in base.all() if u.usage_reasons]
    reasons_cnt: dict = {}
    for lst in reasons_raw:
        if isinstance(lst, list):
            for r in lst:
                reasons_cnt[r] = reasons_cnt.get(r, 0) + 1
    usage_reasons = [{"label": k, "count": v} for k, v in sorted(reasons_cnt.items(), key=lambda x: -x[1])]

    return {
        "countries":     count_col(User.country),
        "genders":       count_col(User.gender),
        "age_ranges":    count_col(User.age_range),
        "ml_levels":     count_col(User.ml_level),
        "discovery":     count_col(User.discovery_source),
        "usage_reasons": usage_reasons,
    }


def _mimetype_to_label(mimetype: str) -> str:
    if not mimetype: return "Autre"
    m = mimetype.lower()
    if "csv" in m or "spreadsheet" in m or "excel" in m: return "CSV / Tableur"
    if "image" in m: return "Image"
    if "audio" in m: return "Audio"
    if "video" in m: return "Video"
    if "text" in m:  return "Texte"
    if "json" in m or "xml" in m: return "JSON / XML"
    return "Autre"


@router.get("/stats/datasets")
def stats_datasets(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    now = datetime.now(timezone.utc)
    total = db.query(func.count(Dataset.id)).scalar() or 0
    this_month = db.query(func.count(Dataset.id)).filter(
        func.extract("year",  Dataset.created_at) == now.year,
        func.extract("month", Dataset.created_at) == now.month,
    ).scalar() or 0
    storage_bytes = db.query(func.sum(Dataset.file_size)).scalar() or 0
    owners_count  = db.query(func.count(func.distinct(Dataset.owner_id))).scalar() or 0

    raw_types = db.query(Dataset.mimetype, func.count().label("n")).group_by(Dataset.mimetype).all()
    type_cnt: dict = {}
    for mimetype, n in raw_types:
        label = _mimetype_to_label(mimetype)
        type_cnt[label] = type_cnt.get(label, 0) + n
    by_type = [{"label": k, "count": v} for k, v in sorted(type_cnt.items(), key=lambda x: -x[1])]

    monthly_raw = db.query(
        func.extract("year",  Dataset.created_at).label("yr"),
        func.extract("month", Dataset.created_at).label("mo"),
        func.count().label("n"),
    ).group_by("yr","mo").order_by("yr","mo").all()
    monthly = [{"label": f"{int(r.yr)}-{int(r.mo):02d}", "count": r.n} for r in monthly_raw][-6:]

    return {"total": total, "this_month": this_month, "storage_bytes": storage_bytes,
            "owners_count": owners_count, "by_type": by_type, "monthly": monthly}


@router.get("/stats/models")
def stats_models(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    now = datetime.now(timezone.utc)
    total = db.query(func.count(Model.id)).scalar() or 0
    this_month = db.query(func.count(Model.id)).filter(
        func.extract("year",  Model.created_at) == now.year,
        func.extract("month", Model.created_at) == now.month,
    ).scalar() or 0
    owners_count = db.query(func.count(func.distinct(Model.owner_id))).scalar() or 0
    algo_count   = db.query(func.count(func.distinct(Model.algorithm))).scalar() or 0

    raw_algo = db.query(Model.algorithm, func.count().label("n")).filter(
        Model.algorithm != None
    ).group_by(Model.algorithm).order_by(func.count().desc()).limit(10).all()
    by_algorithm = [{"label": r[0], "count": r[1]} for r in raw_algo]

    raw_type = db.query(Model.model_type, func.count().label("n")).group_by(Model.model_type).all()
    by_model_type = [{"label": r[0] or "Autre", "count": r[1]} for r in raw_type]

    # Répartition des formats d'export (.pkl / .h5 / .pt)
    all_keys = db.query(Result.model_key).filter(Result.model_key.isnot(None)).all()
    ext_counts = {'.pkl': 0, '.h5': 0, '.pt': 0}
    for (key,) in all_keys:
        for ext in ext_counts:
            if key and key.endswith(ext):
                ext_counts[ext] += 1
    by_export_format = [
        {"label": ext, "count": cnt}
        for ext, cnt in ext_counts.items()
        if cnt > 0
    ]

    return {"total": total, "this_month": this_month, "owners_count": owners_count,
            "algo_count": algo_count, "by_algorithm": by_algorithm,
            "by_model_type": by_model_type, "by_export_format": by_export_format}


@router.get("/stats/experiments")
def stats_experiments(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    now = datetime.now(timezone.utc)
    total = db.query(func.count(Experiment.id)).scalar() or 0
    this_month = db.query(func.count(Experiment.id)).filter(
        func.extract("year",  Experiment.created_at) == now.year,
        func.extract("month", Experiment.created_at) == now.month,
    ).scalar() or 0
    running   = db.query(func.count(Experiment.id)).filter(Experiment.status == "running").scalar()   or 0
    completed = db.query(func.count(Experiment.id)).filter(Experiment.status == "completed").scalar() or 0
    failed    = db.query(func.count(Experiment.id)).filter(Experiment.status == "failed").scalar()    or 0
    success_rate = round(completed / total * 100) if total > 0 else 0

    avg_acc_raw = db.query(func.avg(Result.accuracy)).scalar()
    avg_accuracy = round(avg_acc_raw * 100, 1) if avg_acc_raw is not None else None

    avg_dur_raw = db.query(
        func.avg(func.extract("epoch", Experiment.finished_at) - func.extract("epoch", Experiment.created_at))
    ).filter(Experiment.finished_at != None).scalar()
    avg_duration_min = round(avg_dur_raw / 60, 1) if avg_dur_raw else None

    by_status = [
        {"label": "Terminee",  "count": completed, "color": "#00853F"},
        {"label": "En cours",  "count": running,   "color": "#E8A020"},
        {"label": "Echouee",   "count": failed,    "color": "#DC2626"},
    ]
    by_status = [s for s in by_status if s["count"] > 0]

    monthly_raw = db.query(
        func.extract("year",  Experiment.created_at).label("yr"),
        func.extract("month", Experiment.created_at).label("mo"),
        func.count().label("n"),
    ).group_by("yr","mo").order_by("yr","mo").all()
    monthly = [{"label": f"{int(r.yr)}-{int(r.mo):02d}", "count": r.n} for r in monthly_raw][-6:]

    return {"total": total, "this_month": this_month, "running": running,
            "completed": completed, "failed": failed, "success_rate": success_rate,
            "avg_accuracy": avg_accuracy, "avg_duration_min": avg_duration_min,
            "by_status": by_status, "monthly": monthly}

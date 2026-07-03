"""
Endpoints d'authentification, Login, Register, Me, Forgot/Reset password.
"""
import uuid
import secrets
import string
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel, EmailStr

from app.api.deps import get_db, get_current_user
from app.services.auth_service import AuthService
from app.services.email_service import send_reset_email, send_temp_password_email
from app.schemas.user import UserCreate, UserRead, Token
from app.models.user import User
from app.models.password_reset import PasswordResetToken
from app.core.security import hash_password, verify_password
from app.core.config import settings

router = APIRouter()


# ── Login ─────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    service = AuthService(db)
    user = service.authenticate(email=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # Mettre a jour la date de derniere connexion
    from datetime import datetime, timezone
    user.last_login = datetime.now(timezone.utc)
    db.commit()
    token = service.create_token(user)
    return {"access_token": token, "token_type": "bearer"}


# ── Register ──────────────────────────────────────────────────────────────────

@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    user = AuthService(db).create_user(
        email=payload.email,
        password=payload.password,
        first_name=payload.first_name,
        last_name=payload.last_name,
        country=payload.country,
        gender=payload.gender,
        age_range=payload.age_range,
        usage_reasons=payload.usage_reasons,
        ml_level=payload.ml_level,
        discovery_source=payload.discovery_source,
    )
    return user


# ── Me ────────────────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserRead)
def get_me(current_user=Depends(get_current_user)):
    return current_user


# ── Forgot password ───────────────────────────────────────────────────────────

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Genere un mot de passe temporaire aleatoire, le set comme mot de passe
    de l utilisateur, et l envoie par email.
    Retourne toujours 200 pour ne pas reveler si l email existe.
    """
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        return {"message": "Si ce compte existe, un e-mail a ete envoye."}

    # Generer un mot de passe temporaire : 4 lettres + 4 chiffres + 2 spec
    alphabet = string.ascii_letters + string.digits
    temp_pw  = (
        secrets.choice(string.ascii_uppercase) +
        secrets.choice(string.ascii_lowercase) +
        secrets.choice(string.digits) +
        secrets.choice("!@#$%") +
        "".join(secrets.choice(alphabet) for _ in range(6))
    )
    # Melanger les caracteres
    temp_list = list(temp_pw)
    secrets.SystemRandom().shuffle(temp_list)
    temp_pw = "".join(temp_list)

    user.hashed_password    = hash_password(temp_pw)
    user.must_change_password = True
    db.commit()

    send_temp_password_email(
        to_email=user.email,
        temp_password=temp_pw,
        user_name=user.first_name or user.full_name or "",
    )

    return {"message": "Si ce compte existe, un e-mail a ete envoye."}


# ── Reset password ────────────────────────────────────────────────────────────

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Vérifie le token et met à jour le mot de passe."""
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="Le mot de passe doit comporter au moins 8 caractères.")

    reset_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == payload.token,
        PasswordResetToken.used == False,
    ).first()

    if not reset_token:
        raise HTTPException(status_code=400, detail="Token invalide ou expiré.")

    if reset_token.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Token invalide ou expiré.")

    user = db.query(User).filter(User.id == reset_token.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")

    user.hashed_password = hash_password(payload.new_password)
    reset_token.used = True
    db.commit()

    return {"message": "Mot de passe réinitialisé avec succès."}


# ── Change password (utilisateur connecté) ─────────────────────────────────────

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


@router.post("/change-password", status_code=status.HTTP_200_OK)
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Vérifie l'ancien mot de passe et met à jour vers le nouveau."""
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="Le mot de passe doit comporter au moins 8 caractères.")

    if not verify_password(payload.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Mot de passe actuel incorrect.")

    current_user.hashed_password = hash_password(payload.new_password)
    current_user.must_change_password = False
    db.commit()

    return {"message": "Mot de passe mis à jour avec succès."}


# ── Update profile ────────────────────────────────────────────────────────────

class ProfileUpdate(BaseModel):
    first_name:       Optional[str] = None
    last_name:        Optional[str] = None
    country:          Optional[str] = None
    gender:           Optional[str] = None
    age_range:        Optional[str] = None
    usage_reasons:    Optional[list] = None
    ml_level:         Optional[str] = None
    discovery_source: Optional[str] = None


@router.patch("/me", response_model=UserRead)
def update_profile(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Met a jour le profil de l utilisateur connecte."""
    user = db.query(User).filter(User.id == current_user.id).first()
    fields = payload.model_dump(exclude_none=True)
    for key, value in fields.items():
        setattr(user, key, value)
    # Recalculer full_name si first/last changent
    fn = fields.get("first_name", user.first_name) or ""
    ln = fields.get("last_name",  user.last_name)  or ""
    if fn or ln:
        user.full_name = f"{fn} {ln}".strip()
    db.commit()
    db.refresh(user)
    return user

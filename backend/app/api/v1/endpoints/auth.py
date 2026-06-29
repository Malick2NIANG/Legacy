"""
Endpoints d'authentification — Login, Register, Me, Forgot/Reset password.
"""
import uuid
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.api.deps import get_db, get_current_user
from app.services.auth_service import AuthService
from app.services.email_service import send_reset_email
from app.schemas.user import UserCreate, UserRead, Token
from app.models.user import User
from app.models.password_reset import PasswordResetToken
from app.core.security import hash_password, verify_password
from app.core.config import settings

router = APIRouter()


# ── Login ─────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    token = AuthService(db).login(email=form_data.username, password=form_data.password)
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
    Génère un token de réinitialisation et envoie un e-mail.
    Retourne toujours 200 pour ne pas révéler si l'e-mail existe.
    """
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        # Réponse identique pour ne pas fuiter les e-mails enregistrés
        return {"message": "Si ce compte existe, un e-mail a été envoyé."}

    # Invalider les anciens tokens non utilisés
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used == False,
    ).delete()

    # Créer un nouveau token valide 1 heure
    token = str(uuid.uuid4())
    expires = datetime.now(timezone.utc) + timedelta(hours=1)
    reset_token = PasswordResetToken(user_id=user.id, token=token, expires_at=expires)
    db.add(reset_token)
    db.commit()

    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    send_reset_email(to_email=user.email, reset_link=reset_link)

    return {"message": "Si ce compte existe, un e-mail a été envoyé."}


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
        raise HTTPException(status_code=400, detail="Lien invalide ou déjà utilisé.")

    if datetime.now(timezone.utc) > reset_token.expires_at:
        raise HTTPException(status_code=400, detail="Ce lien a expiré. Veuillez en demander un nouveau.")

    # Mettre à jour le mot de passe
    user = db.query(User).filter(User.id == reset_token.user_id).first()
    user.hashed_password = hash_password(payload.new_password)

    # Invalider le token
    reset_token.used = True
    db.commit()

    return {"message": "Mot de passe mis à jour avec succès."}


# ── Change password (utilisateur connecté) ────────────────────────────────────

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
    db.commit()

    return {"message": "Mot de passe mis à jour avec succès."}

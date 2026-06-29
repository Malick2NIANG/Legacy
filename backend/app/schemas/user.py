"""
Schémas Pydantic pour la validation des données utilisateur.
"""
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List


class UserCreate(BaseModel):
    """Inscription complète avec profil démographique (stepper 4 étapes)."""
    # Étape 1 — Compte
    first_name: str
    last_name: str
    email: EmailStr
    password: str

    # Étape 2 — Profil
    country: str
    gender: Optional[str] = "unspecified"   # "male" | "female" | "unspecified"
    age_range: str                           # "18-24" | "25-34" | "35-44" | "45+"

    # Étape 3 — Usage
    usage_reasons: List[str]                 # ["studies", "work", …]
    ml_level: str                            # "beginner" | "intermediate" | "advanced"

    # Étape 4 — Découverte
    discovery_source: str                    # "word_of_mouth" | "social" | "web" | "school" | "other"


class UserRead(BaseModel):
    """Données retournées au client (sans mot de passe)."""
    id: int
    email: EmailStr
    full_name: Optional[str]
    first_name: Optional[str]
    last_name: Optional[str]
    is_active: bool
    is_admin: bool
    created_at: datetime

    # Champs démographiques (optionnels — anciens comptes)
    country: Optional[str]          = None
    gender: Optional[str]           = None
    age_range: Optional[str]        = None
    usage_reasons: Optional[List[str]] = None
    ml_level: Optional[str]         = None
    discovery_source: Optional[str] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    """Token JWT retourné après authentification réussie."""
    access_token: str
    token_type: str = "bearer"

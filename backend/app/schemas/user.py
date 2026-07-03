"""
Schemas Pydantic pour la validation des donnees utilisateur.
"""
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List


class UserCreate(BaseModel):
    """Inscription complete avec profil demographique (stepper 4 etapes)."""
    first_name:       str
    last_name:        str
    email:            EmailStr
    password:         str
    country:          str
    gender:           Optional[str] = "unspecified"
    age_range:        str
    usage_reasons:    List[str]
    ml_level:         str
    discovery_source: Optional[str] = None


class UserRead(BaseModel):
    """Profil utilisateur retourne par l API."""
    id:               int
    email:            str
    full_name:        Optional[str] = None
    first_name:       Optional[str] = None
    last_name:        Optional[str] = None
    country:          Optional[str] = None
    gender:           Optional[str] = None
    age_range:        Optional[str] = None
    usage_reasons:    Optional[List[str]] = None
    ml_level:         Optional[str] = None
    discovery_source: Optional[str] = None
    is_admin:         bool = False
    is_active:        bool = True
    must_change_password: bool = False
    last_login:       Optional[datetime] = None
    created_at:       Optional[datetime] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    """Reponse JWT apres login."""
    access_token: str
    token_type:   str

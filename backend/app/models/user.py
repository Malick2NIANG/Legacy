"""
Modèle SQLAlchemy pour la table 'users'.
Stocke les informations d'authentification et le profil utilisateur.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id             = Column(Integer, primary_key=True, index=True)
    email          = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name      = Column(String)          # "Prénom Nom" — conservé pour compat
    first_name     = Column(String)
    last_name      = Column(String)
    is_active      = Column(Boolean, default=True)
    is_admin       = Column(Boolean, default=False)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())

    # ── Profil démographique ──────────────────────────────────────────────────
    country          = Column(String)           # "France", "Sénégal", …
    gender           = Column(String)           # "male" | "female" | "unspecified"
    age_range        = Column(String)           # "18-24" | "25-34" | "35-44" | "45+"
    usage_reasons    = Column(JSON)             # ["studies", "work", …]
    ml_level         = Column(String)           # "beginner" | "intermediate" | "advanced"
    discovery_source = Column(String)           # "word_of_mouth" | "social" | "web" | "school" | "other"

"""
Modele SQLAlchemy pour la table users.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    email           = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name       = Column(String)
    first_name      = Column(String)
    last_name       = Column(String)
    is_active       = Column(Boolean, default=True)
    is_admin        = Column(Boolean, default=False)

    country          = Column(String)
    gender           = Column(String, default="unspecified")
    age_range        = Column(String)
    usage_reasons    = Column(JSON)
    ml_level         = Column(String)
    discovery_source = Column(String)
    must_change_password = Column(Boolean, default=False)

    last_login  = Column(DateTime(timezone=True))
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())

"""
Modele SQLAlchemy pour la table 'models'.
Stocke les configurations de modeles ML.
"""
from sqlalchemy import Column, Integer, String, JSON, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.core.database import Base


class Model(Base):
    __tablename__ = "models"

    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String, nullable=False)
    description   = Column(String)
    model_type    = Column(String, default="sklearn", nullable=False)
    algorithm     = Column(String)
    hf_model_id   = Column(String)
    cv_task       = Column(String)
    version       = Column(String, default="v1 - initial")
    hyperparameters = Column(JSON, default={})
    owner_id      = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    updated_at    = Column(DateTime(timezone=True), onupdate=func.now())

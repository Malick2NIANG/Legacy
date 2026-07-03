"""
Modèle SQLAlchemy pour la table 'results'.
Stocke les métriques de performance calculées après chaque expérience.
"""
from sqlalchemy import Column, Integer, Float, JSON, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.core.database import Base


class Result(Base):
    __tablename__ = "results"

    id = Column(Integer, primary_key=True, index=True)
    experiment_id = Column(Integer, ForeignKey("experiments.id"), unique=True, nullable=False)
    accuracy = Column(Float)
    precision = Column(Float)
    recall = Column(Float)
    f1_score = Column(Float)
    confusion_matrix = Column(JSON)
    training_history = Column(JSON)
    model_key = Column(String, nullable=True)   # cle MinIO du .pkl entraine
    created_at = Column(DateTime(timezone=True), server_default=func.now())

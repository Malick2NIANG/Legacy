"""
Modèle SQLAlchemy pour la table 'datasets'.
Stocke les métadonnées des fichiers uploadés dans MinIO.
"""
from sqlalchemy import Column, Integer, String, BigInteger, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.core.database import Base


class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    filename = Column(String, nullable=False)
    file_size = Column(BigInteger)
    mimetype = Column(String)
    minio_key = Column(String, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    version = Column(Integer, nullable=False, default=1)

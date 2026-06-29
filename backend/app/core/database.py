"""
Configuration de la connexion à la base de données PostgreSQL via SQLAlchemy.
Expose le moteur, la session factory et la base déclarative pour les modèles ORM.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base déclarative partagée par tous les modèles SQLAlchemy."""
    pass


def get_db():
    """Générateur de session DB pour l'injection de dépendances FastAPI."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

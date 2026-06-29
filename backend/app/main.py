"""
Point d'entrée de l'application FastAPI.
Configure l'app, les middlewares CORS, et inclut le router principal de l'API v1.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.on_event("startup")
def run_migrations():
    """Ajoute les colonnes démographiques si elles n'existent pas encore (migration légère)."""
    from app.core.database import engine
    from sqlalchemy import text
    new_columns = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS age_range VARCHAR",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS usage_reasons JSON",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS ml_level VARCHAR",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS discovery_source VARCHAR",
    ]
    try:
        with engine.connect() as conn:
            for sql in new_columns:
                conn.execute(text(sql))
            conn.commit()
    except Exception:
        pass  # Table peut ne pas encore exister au premier boot


@app.get("/health")
def health_check():
    """Endpoint de vérification de santé du service."""
    return {"status": "ok"}

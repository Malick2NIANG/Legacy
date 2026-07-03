"""
Point d'entree principal de l'application FastAPI.
Gere le demarrage, les migrations et l'enregistrement des routes.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.core.database import engine
from app.core.config import settings
from app.api.v1.router import api_router

app = FastAPI(
    title="DS Platform API",
    version="1.0.0",
    description="Plateforme de data science et machine learning",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(api_router, prefix="/api/v1")

# Migration au demarrage
new_columns = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR DEFAULT 'unspecified'",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS age_range VARCHAR",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS usage_reasons JSONB",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS ml_level VARCHAR",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS discovery_source VARCHAR",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE",
    "ALTER TABLE models ADD COLUMN IF NOT EXISTS description VARCHAR",
    "ALTER TABLE models ADD COLUMN IF NOT EXISTS model_type VARCHAR DEFAULT 'sklearn'",
    "ALTER TABLE models ADD COLUMN IF NOT EXISTS hf_model_id VARCHAR",
    "ALTER TABLE models ADD COLUMN IF NOT EXISTS cv_task VARCHAR",
    "ALTER TABLE models ADD COLUMN IF NOT EXISTS version VARCHAR DEFAULT 'v1'",
    "ALTER TABLE models ALTER COLUMN algorithm DROP NOT NULL",
    "ALTER TABLE datasets ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1",
]

create_admin_actions = """
CREATE TABLE IF NOT EXISTS admin_actions (
    id              SERIAL PRIMARY KEY,
    action_type     VARCHAR NOT NULL,
    target_user_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
    target_email    VARCHAR,
    target_name     VARCHAR,
    requested_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_by_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status          VARCHAR DEFAULT 'pending',
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT now(),
    resolved_at     TIMESTAMP WITH TIME ZONE
)
"""


@app.on_event("startup")
def startup_migrations():
    try:
        with engine.connect() as conn:
            for sql in new_columns:
                conn.execute(text(sql))
            conn.execute(text(create_admin_actions))
            conn.commit()
    except Exception:
        pass


@app.get("/health")
def health_check():
    return {"status": "ok"}

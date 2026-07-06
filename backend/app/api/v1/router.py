"""
Router principal de l'API v1.
Agregre tous les routers des endpoints.
"""
from fastapi import APIRouter
from app.api.v1.endpoints import auth, datasets, models, experiments, results, admin, dashboard, utils

api_router = APIRouter()

api_router.include_router(auth.router,        prefix="/auth",        tags=["Authentication"])
api_router.include_router(datasets.router,    prefix="/datasets",    tags=["Datasets"])
api_router.include_router(models.router,      prefix="/models",      tags=["Models"])
api_router.include_router(experiments.router, prefix="/experiments", tags=["Experiments"])
api_router.include_router(results.router,     prefix="/results",     tags=["Results"])
api_router.include_router(admin.router,       prefix="/admin",       tags=["Admin"])
api_router.include_router(dashboard.router,   prefix="/dashboard",   tags=["Dashboard"])
api_router.include_router(utils.router,       prefix="/utils",       tags=["Utils"])

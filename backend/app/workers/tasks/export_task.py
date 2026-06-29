"""
Tâche Celery d'export des résultats.
Génère les fichiers CSV, JSON ou PDF à partir des résultats stockés en DB.
"""
from app.workers.celery_app import celery_app


@celery_app.task(name="export_results")
def export_results(experiment_id: int, format: str = "csv"):
    """
    Tâche asynchrone d'export.

    Formats supportés : csv, json, pdf
    Le fichier généré est uploadé dans MinIO et une URL présignée est retournée.
    """
    # TODO: charger les résultats, formater, uploader dans MinIO
    pass

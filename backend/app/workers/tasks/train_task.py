"""
Tâche Celery d'entraînement ML.
Récupère le dataset depuis MinIO, entraîne le modèle sklearn et sauvegarde les résultats.
"""
import io
import json
import numpy as np
import pandas as pd
from datetime import datetime, timezone

from celery import states
from app.workers.celery_app import celery_app


@celery_app.task(bind=True, name="train_model")
def train_model(self, experiment_id: int):
    """
    Tâche asynchrone d'entraînement.

    Étapes :
    1. Charger l'expérience + dataset + modèle depuis la DB
    2. Télécharger le CSV depuis MinIO
    3. Prétraiter (encoder catégorielles, séparer X/y, split train/test)
    4. Entraîner le modèle sklearn selon l'algorithme choisi
    5. Calculer accuracy, precision, recall, F1, matrice de confusion
    6. Sauvegarder les résultats en DB
    7. Mettre à jour le statut de l'expérience
    """
    from app.core.database import SessionLocal
    from app.models.experiment import Experiment, ExperimentStatus
    from app.models.dataset import Dataset
    from app.models.model import Model as MLModel
    from app.models.result import Result
    from app.services.storage_service import StorageService

    from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
    from sklearn.linear_model import LogisticRegression
    from sklearn.svm import SVC
    from sklearn.tree import DecisionTreeClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import LabelEncoder
    from sklearn.metrics import (
        accuracy_score, precision_score, recall_score,
        f1_score, confusion_matrix
    )

    db = SessionLocal()
    try:
        # 1. Charger l'expérience
        exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
        if not exp:
            return {"error": f"Expérience {experiment_id} introuvable"}

        exp.status = ExperimentStatus.RUNNING
        db.commit()
        self.update_state(state=states.STARTED, meta={"step": "Chargement des données"})

        # 2. Récupérer dataset + modèle
        dataset = db.query(Dataset).filter(Dataset.id == exp.dataset_id).first()
        ml_model = db.query(MLModel).filter(MLModel.id == exp.model_id).first()

        # 3. Télécharger le CSV depuis MinIO
        storage = StorageService()
        response = storage.client.get_object(storage.bucket, dataset.minio_key)
        df = pd.read_csv(io.BytesIO(response.read()))
        response.close()

        # Encodage des colonnes catégorielles
        for col in df.select_dtypes(include=["object"]).columns:
            df[col] = LabelEncoder().fit_transform(df[col].astype(str))

        # La dernière colonne est la cible (target)
        X = df.iloc[:, :-1].values
        y = df.iloc[:, -1].values

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        self.update_state(state=states.STARTED, meta={"step": "Entraînement du modèle"})

        # 4. Choisir l'algorithme
        algo = (ml_model.algorithm or "random_forest").lower()
        hp = ml_model.hyperparameters or {}

        ALGORITHMS = {
            "random_forest": RandomForestClassifier,
            "gradient_boosting": GradientBoostingClassifier,
            "logistic_regression": LogisticRegression,
            "svm": SVC,
            "decision_tree": DecisionTreeClassifier,
        }
        clf_class = ALGORITHMS.get(algo, RandomForestClassifier)
        clf = clf_class(**{k: v for k, v in hp.items() if v is not None})
        clf.fit(X_train, y_train)
        y_pred = clf.predict(X_test)

        # 5. Métriques
        avg = "weighted"
        acc = float(accuracy_score(y_test, y_pred))
        prec = float(precision_score(y_test, y_pred, average=avg, zero_division=0))
        rec = float(recall_score(y_test, y_pred, average=avg, zero_division=0))
        f1 = float(f1_score(y_test, y_pred, average=avg, zero_division=0))
        cm = confusion_matrix(y_test, y_pred).tolist()

        self.update_state(state=states.STARTED, meta={"step": "Sauvegarde des résultats"})

        # 6. Sauvegarder les résultats
        existing = db.query(Result).filter(Result.experiment_id == exp.id).first()
        if existing:
            existing.accuracy = acc
            existing.precision = prec
            existing.recall = rec
            existing.f1_score = f1
            existing.confusion_matrix = cm
        else:
            result = Result(
                experiment_id=exp.id,
                accuracy=acc,
                precision=prec,
                recall=rec,
                f1_score=f1,
                confusion_matrix=cm,
            )
            db.add(result)

        # 7. Mettre à jour le statut
        exp.status = ExperimentStatus.COMPLETED
        exp.finished_at = datetime.now(timezone.utc)
        db.commit()

        return {"accuracy": acc, "f1": f1, "status": "completed"}

    except Exception as exc:
        # En cas d'erreur, marquer l'expérience comme échouée
        try:
            exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
            if exp:
                exp.status = ExperimentStatus.FAILED
                exp.finished_at = datetime.now(timezone.utc)
                db.commit()
        except Exception:
            pass
        raise exc

    finally:
        db.close()

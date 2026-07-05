"""
Tache Celery d entrainement ML.
Pipelines supportes : sklearn, computer_vision, audio, video, tensorflow, pytorch.
"""
import io
import os
import json
import zipfile
import tempfile
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timezone

from celery import states
from app.workers.celery_app import celery_app


def _compute_metrics(y_test, y_pred):
    from sklearn.metrics import (
        accuracy_score, precision_score, recall_score, f1_score, confusion_matrix,
    )
    avg = "weighted"
    return {
        "acc":  float(accuracy_score(y_test, y_pred)),
        "prec": float(precision_score(y_test, y_pred, average=avg, zero_division=0)),
        "rec":  float(recall_score(y_test, y_pred, average=avg, zero_division=0)),
        "f1":   float(f1_score(y_test, y_pred, average=avg, zero_division=0)),
        "cm":   confusion_matrix(y_test, y_pred).tolist(),
    }


def _learning_curve_sklearn(clf_class, hp, X, y):
    from sklearn.model_selection import learning_curve
    try:
        n_samples = X.shape[0]
        n_points  = min(10, max(3, n_samples // 10))
        cv_folds  = min(5, n_samples // 10) if n_samples >= 20 else 2
        if cv_folds < 2:
            return {}
        clf2 = clf_class(**{k: v for k, v in hp.items() if v is not None})
        sizes, tr, val = learning_curve(
            clf2, X, y, cv=cv_folds,
            train_sizes=np.linspace(0.1, 1.0, n_points),
            scoring="accuracy", n_jobs=-1,
        )
        return {
            "train_sizes":  [int(s) for s in sizes.tolist()],
            "train_scores": [round(float(s), 4) for s in tr.mean(axis=1).tolist()],
            "val_scores":   [round(float(s), 4) for s in val.mean(axis=1).tolist()],
        }
    except Exception:
        return {}


def _export_pkl(clf, storage, exp_id, tag):
    try:
        with tempfile.NamedTemporaryFile(suffix=".pkl", delete=False) as tmp:
            tmp_path = tmp.name
        joblib.dump(clf, tmp_path)
        with open(tmp_path, "rb") as f:
            pkl_bytes = f.read()
        os.unlink(tmp_path)
        key = f"models/experiment_{exp_id}_{tag}.pkl"
        storage.upload(pkl_bytes, key, "application/octet-stream")
        return key
    except Exception:
        return None


def _train_sklearn(task, dataset_bytes, ml_model, storage, exp_id):
    from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
    from sklearn.linear_model import LogisticRegression
    from sklearn.svm import SVC
    from sklearn.tree import DecisionTreeClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import LabelEncoder

    df = pd.read_csv(io.BytesIO(dataset_bytes))
    for col in df.select_dtypes(include=["object"]).columns:
        df[col] = LabelEncoder().fit_transform(df[col].astype(str))

    X = df.iloc[:, :-1].values
    y = df.iloc[:, -1].values
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    task.update_state(state=states.STARTED, meta={"step": "Entrainement du modele"})

    algo = (ml_model.algorithm or "random_forest").lower()
    hp = {k: v for k, v in (ml_model.hyperparameters or {}).items() if v is not None}

    ALGOS = {
        "random_forest":       RandomForestClassifier,
        "gradient_boosting":   GradientBoostingClassifier,
        "logistic_regression": LogisticRegression,
        "svm":                 SVC,
        "decision_tree":       DecisionTreeClassifier,
    }
    clf_class = ALGOS.get(algo, RandomForestClassifier)
    clf = clf_class(**hp)
    clf.fit(X_train, y_train)
    y_pred = clf.predict(X_test)

    metrics = _compute_metrics(y_test, y_pred)

    task.update_state(state=states.STARTED, meta={"step": "Calcul de la courbe d apprentissage"})
    training_history = _learning_curve_sklearn(clf_class, hp, X, y)

    task.update_state(state=states.STARTED, meta={"step": "Export du modele"})
    model_key = _export_pkl(clf, storage, exp_id, algo)

    return metrics, training_history, model_key


def _train_cv(task, dataset_bytes, ml_model, storage, exp_id):
    from PIL import Image
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import LabelEncoder

    IMG_SIZE = 64
    VALID_EXT = {"jpg", "jpeg", "png", "bmp", "webp"}

    task.update_state(state=states.STARTED, meta={"step": "Extraction des images"})

    X_raw, y_raw = [], []
    le = LabelEncoder()

    with zipfile.ZipFile(io.BytesIO(dataset_bytes)) as zf:
        for path in zf.namelist():
            if path.endswith("/"):
                continue
            parts = [p for p in path.replace("\\", "/").split("/") if p]
            if len(parts) < 2:
                continue
            class_name = parts[-2]
            ext = parts[-1].lower().rsplit(".", 1)[-1] if "." in parts[-1] else ""
            if ext not in VALID_EXT:
                continue
            try:
                img_bytes = zf.read(path)
                img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
                img = img.resize((IMG_SIZE, IMG_SIZE), Image.LANCZOS)
                X_raw.append(np.array(img, dtype=np.float32).flatten() / 255.0)
                y_raw.append(class_name)
            except Exception:
                continue

    if len(X_raw) < 4:
        raise ValueError(
            f"Dataset CV invalide : {len(X_raw)} images valides trouvees. "
            "Structure attendue : ZIP avec sous-dossiers par classe."
        )

    X = np.array(X_raw)
    y = le.fit_transform(y_raw)
    classes = list(le.classes_)

    stratify = y if len(set(y)) > 1 and min(np.bincount(y)) >= 2 else None
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=stratify
    )

    task.update_state(state=states.STARTED, meta={"step": "Entrainement du modele"})

    hp = {k: v for k, v in (ml_model.hyperparameters or {}).items()
          if v is not None and k not in ("hf_api_key",)}
    n_est = int(hp.pop("n_estimators", 100))
    clf = RandomForestClassifier(n_estimators=n_est, **hp)
    clf.fit(X_train, y_train)
    y_pred = clf.predict(X_test)

    metrics = _compute_metrics(y_test, y_pred)

    task.update_state(state=states.STARTED, meta={"step": "Calcul de la courbe d apprentissage"})
    training_history = _learning_curve_sklearn(RandomForestClassifier, {"n_estimators": 50}, X, y)
    training_history.update({
        "classes":  classes,
        "n_images": len(X_raw),
        "img_size": f"{IMG_SIZE}x{IMG_SIZE}",
    })

    task.update_state(state=states.STARTED, meta={"step": "Export du modele"})
    model_key = _export_pkl(clf, storage, exp_id, "cv_rf")

    return metrics, training_history, model_key




def _train_audio(task, dataset_bytes, ml_model, storage, exp_id):
    import librosa
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import LabelEncoder

    VALID_EXT = {"wav", "mp3", "flac", "ogg", "m4a"}

    task.update_state(state=states.STARTED, meta={"step": "Extraction des features audio (MFCC)"})

    hp = {k: v for k, v in (ml_model.hyperparameters or {}).items()
          if v is not None and k not in ("hf_api_key",)}
    n_mfcc = int(hp.pop("n_mfcc", 40))
    n_est  = int(hp.pop("n_estimators", 100))

    X_raw, y_raw = [], []

    with zipfile.ZipFile(io.BytesIO(dataset_bytes)) as zf:
        for path in zf.namelist():
            if path.endswith("/"):
                continue
            parts = [p for p in path.replace("\\", "/").split("/") if p]
            if len(parts) < 2:
                continue
            class_name = parts[-2]
            ext = parts[-1].lower().rsplit(".", 1)[-1] if "." in parts[-1] else ""
            if ext not in VALID_EXT:
                continue
            try:
                audio_bytes = zf.read(path)
                with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as tmp:
                    tmp.write(audio_bytes)
                    tmp_path = tmp.name
                try:
                    y_audio, sr = librosa.load(tmp_path, sr=22050, mono=True)
                    mfcc = librosa.feature.mfcc(y=y_audio, sr=sr, n_mfcc=n_mfcc)
                    features = np.concatenate([mfcc.mean(axis=1), mfcc.std(axis=1)])
                    X_raw.append(features.astype(np.float32))
                    y_raw.append(class_name)
                finally:
                    os.unlink(tmp_path)
            except Exception:
                continue

    if len(X_raw) < 4:
        raise ValueError(
            f"Dataset Audio invalide : {len(X_raw)} fichiers valides trouves. "
            "Structure attendue : ZIP avec sous-dossiers par classe (classe/audio.wav)."
        )

    X = np.array(X_raw)
    le = LabelEncoder()
    y = le.fit_transform(y_raw)
    classes = list(le.classes_)

    stratify = y if len(set(y)) > 1 and min(np.bincount(y)) >= 2 else None
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=stratify
    )

    task.update_state(state=states.STARTED, meta={"step": "Entrainement du modele audio"})

    clf = RandomForestClassifier(n_estimators=n_est, **hp)
    clf.fit(X_train, y_train)
    y_pred = clf.predict(X_test)

    metrics = _compute_metrics(y_test, y_pred)

    task.update_state(state=states.STARTED, meta={"step": "Calcul de la courbe d apprentissage"})
    training_history = _learning_curve_sklearn(
        RandomForestClassifier, {"n_estimators": min(50, n_est)}, X, y
    )
    training_history.update({
        "classes":   classes,
        "n_samples": len(X_raw),
        "n_mfcc":    n_mfcc,
        "pipeline":  "MFCC",
    })

    task.update_state(state=states.STARTED, meta={"step": "Export du modele"})
    model_key = _export_pkl(clf, storage, exp_id, "audio_rf")

    return metrics, training_history, model_key


def _train_video(task, dataset_bytes, ml_model, storage, exp_id):
    import cv2
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import LabelEncoder

    VALID_EXT = {"mp4", "avi", "mov", "mkv", "webm"}

    task.update_state(state=states.STARTED, meta={"step": "Extraction des frames video"})

    hp = {k: v for k, v in (ml_model.hyperparameters or {}).items()
          if v is not None and k not in ("hf_api_key",)}
    n_est      = int(hp.pop("n_estimators", 100))
    frame_step = int(hp.pop("frame_step", 30))
    img_size   = int(hp.pop("img_size", 32))

    X_raw, y_raw = [], []

    with zipfile.ZipFile(io.BytesIO(dataset_bytes)) as zf:
        for path in zf.namelist():
            if path.endswith("/"):
                continue
            parts = [p for p in path.replace("\\", "/").split("/") if p]
            if len(parts) < 2:
                continue
            class_name = parts[-2]
            ext = parts[-1].lower().rsplit(".", 1)[-1] if "." in parts[-1] else ""
            if ext not in VALID_EXT:
                continue
            try:
                video_bytes = zf.read(path)
                with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as tmp:
                    tmp.write(video_bytes)
                    tmp_path = tmp.name
                try:
                    cap = cv2.VideoCapture(tmp_path)
                    frame_idx = 0
                    frame_features = []
                    while True:
                        ret, frame = cap.read()
                        if not ret:
                            break
                        if frame_idx % frame_step == 0:
                            resized = cv2.resize(frame, (img_size, img_size))
                            rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
                            frame_features.append((rgb.astype(np.float32) / 255.0).flatten())
                        frame_idx += 1
                    cap.release()
                    if frame_features:
                        X_raw.append(np.mean(frame_features, axis=0))
                        y_raw.append(class_name)
                finally:
                    os.unlink(tmp_path)
            except Exception:
                continue

    if len(X_raw) < 4:
        raise ValueError(
            f"Dataset Video invalide : {len(X_raw)} videos valides trouvees. "
            "Structure attendue : ZIP avec sous-dossiers par classe (classe/video.mp4)."
        )

    X = np.array(X_raw)
    le = LabelEncoder()
    y = le.fit_transform(y_raw)
    classes = list(le.classes_)

    stratify = y if len(set(y)) > 1 and min(np.bincount(y)) >= 2 else None
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=stratify
    )

    task.update_state(state=states.STARTED, meta={"step": "Entrainement du modele video"})

    clf = RandomForestClassifier(n_estimators=n_est, **hp)
    clf.fit(X_train, y_train)
    y_pred = clf.predict(X_test)

    metrics = _compute_metrics(y_test, y_pred)

    task.update_state(state=states.STARTED, meta={"step": "Calcul de la courbe d apprentissage"})
    training_history = _learning_curve_sklearn(
        RandomForestClassifier, {"n_estimators": min(50, n_est)}, X, y
    )
    training_history.update({
        "classes":    classes,
        "n_videos":   len(X_raw),
        "frame_step": frame_step,
        "img_size":   f"{img_size}x{img_size}",
        "pipeline":   "VideoFrames",
    })

    task.update_state(state=states.STARTED, meta={"step": "Export du modele"})
    model_key = _export_pkl(clf, storage, exp_id, "video_rf")

    return metrics, training_history, model_key



def _train_tf(task, dataset_bytes, ml_model, storage, exp_id):
    """Pipeline TensorFlow : reseau Dense sur donnees tabulaires CSV, export .h5."""
    import tensorflow as tf
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import LabelEncoder, StandardScaler
    from sklearn.metrics import (
        accuracy_score, precision_score, recall_score, f1_score, confusion_matrix,
    )

    task.update_state(state=states.STARTED, meta={"step": "Chargement et preparation des donnees"})

    df = pd.read_csv(io.BytesIO(dataset_bytes))
    for col in df.select_dtypes(include=["object"]).columns:
        df[col] = LabelEncoder().fit_transform(df[col].astype(str))

    X = df.iloc[:, :-1].values.astype(np.float32)
    y_raw = df.iloc[:, -1].values
    le = LabelEncoder()
    y = le.fit_transform(y_raw)
    n_classes = len(le.classes_)
    n_features = X.shape[1]

    scaler = StandardScaler()
    X = scaler.fit_transform(X)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    hp = ml_model.hyperparameters or {}
    epochs       = int(hp.get("epochs",       20))
    lr           = float(hp.get("learning_rate", 0.001))
    batch_size   = int(hp.get("batch_size",   32))
    hidden_units = int(hp.get("hidden_units", 128))
    dropout      = float(hp.get("dropout",    0.2))

    task.update_state(state=states.STARTED, meta={"step": "Construction du reseau TensorFlow"})

    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(n_features,)),
        tf.keras.layers.Dense(hidden_units, activation="relu"),
        tf.keras.layers.Dropout(dropout),
        tf.keras.layers.Dense(hidden_units // 2, activation="relu"),
        tf.keras.layers.Dropout(dropout / 2),
        tf.keras.layers.Dense(
            1 if n_classes == 2 else n_classes,
            activation="sigmoid" if n_classes == 2 else "softmax",
        ),
    ])

    loss = "binary_crossentropy" if n_classes == 2 else "sparse_categorical_crossentropy"
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=lr),
        loss=loss,
        metrics=["accuracy"],
    )

    task.update_state(state=states.STARTED, meta={"step": "Entrainement TensorFlow"})

    history_cb = model.fit(
        X_train, y_train,
        epochs=epochs,
        batch_size=batch_size,
        validation_split=0.1,
        verbose=0,
    )

    task.update_state(state=states.STARTED, meta={"step": "Evaluation du modele"})

    if n_classes == 2:
        y_prob = model.predict(X_test, verbose=0).flatten()
        y_pred = (y_prob >= 0.5).astype(int)
    else:
        y_pred = np.argmax(model.predict(X_test, verbose=0), axis=1)

    avg = "weighted"
    metrics = {
        "acc":  float(accuracy_score(y_test, y_pred)),
        "prec": float(precision_score(y_test, y_pred, average=avg, zero_division=0)),
        "rec":  float(recall_score(y_test, y_pred, average=avg, zero_division=0)),
        "f1":   float(f1_score(y_test, y_pred, average=avg, zero_division=0)),
        "cm":   confusion_matrix(y_test, y_pred).tolist(),
    }

    hist = history_cb.history
    training_history = {
        "loss":     [round(float(v), 4) for v in hist.get("loss", [])],
        "accuracy": [round(float(v), 4) for v in hist.get("accuracy", [])],
        "val_loss": [round(float(v), 4) for v in hist.get("val_loss", [])],
        "val_accuracy": [round(float(v), 4) for v in hist.get("val_accuracy", [])],
        "epochs":   epochs,
        "framework": "tensorflow",
    }

    task.update_state(state=states.STARTED, meta={"step": "Export du modele (.h5)"})
    model_key = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".h5", delete=False) as tmp:
            tmp_path = tmp.name
        model.save(tmp_path)
        with open(tmp_path, "rb") as f:
            h5_bytes = f.read()
        os.unlink(tmp_path)
        model_key = f"models/experiment_{exp_id}_tf.h5"
        storage.upload(h5_bytes, model_key, "application/octet-stream")
    except Exception:
        pass

    return metrics, training_history, model_key


def _train_pytorch(task, dataset_bytes, ml_model, storage, exp_id):
    """Pipeline PyTorch : reseau Dense sur donnees tabulaires CSV, export .pt."""
    import torch
    import torch.nn as nn
    from torch.utils.data import DataLoader, TensorDataset
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import LabelEncoder, StandardScaler
    from sklearn.metrics import (
        accuracy_score, precision_score, recall_score, f1_score, confusion_matrix,
    )

    task.update_state(state=states.STARTED, meta={"step": "Chargement et preparation des donnees"})

    df = pd.read_csv(io.BytesIO(dataset_bytes))
    for col in df.select_dtypes(include=["object"]).columns:
        df[col] = LabelEncoder().fit_transform(df[col].astype(str))

    X = df.iloc[:, :-1].values.astype(np.float32)
    y_raw = df.iloc[:, -1].values
    le = LabelEncoder()
    y = le.fit_transform(y_raw).astype(np.int64)
    n_classes  = len(le.classes_)
    n_features = X.shape[1]

    scaler = StandardScaler()
    X = scaler.fit_transform(X).astype(np.float32)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    hp = ml_model.hyperparameters or {}
    epochs       = int(hp.get("epochs",       20))
    lr           = float(hp.get("learning_rate", 0.001))
    batch_size   = int(hp.get("batch_size",   32))
    hidden_units = int(hp.get("hidden_units", 128))
    dropout      = float(hp.get("dropout",    0.2))

    task.update_state(state=states.STARTED, meta={"step": "Construction du reseau PyTorch"})

    class TabularNet(nn.Module):
        def __init__(self):
            super().__init__()
            self.net = nn.Sequential(
                nn.Linear(n_features, hidden_units),
                nn.ReLU(),
                nn.Dropout(dropout),
                nn.Linear(hidden_units, hidden_units // 2),
                nn.ReLU(),
                nn.Dropout(dropout / 2),
                nn.Linear(hidden_units // 2, n_classes),
            )
        def forward(self, x):
            return self.net(x)

    device = torch.device("cpu")
    model = TabularNet().to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    criterion = nn.CrossEntropyLoss()

    X_tr = torch.tensor(X_train)
    y_tr = torch.tensor(y_train)
    loader = DataLoader(TensorDataset(X_tr, y_tr), batch_size=batch_size, shuffle=True)

    task.update_state(state=states.STARTED, meta={"step": "Entrainement PyTorch"})

    loss_history, acc_history = [], []
    for epoch in range(epochs):
        model.train()
        epoch_loss = 0.0
        for xb, yb in loader:
            optimizer.zero_grad()
            out  = model(xb)
            loss = criterion(out, yb)
            loss.backward()
            optimizer.step()
            epoch_loss += loss.item() * len(xb)
        epoch_loss /= len(X_train)

        model.eval()
        with torch.no_grad():
            preds_ep = model(torch.tensor(X_train)).argmax(dim=1).numpy()
        acc_ep = float(accuracy_score(y_train, preds_ep))
        loss_history.append(round(epoch_loss, 4))
        acc_history.append(round(acc_ep, 4))

    task.update_state(state=states.STARTED, meta={"step": "Evaluation du modele"})

    model.eval()
    with torch.no_grad():
        y_pred = model(torch.tensor(X_test)).argmax(dim=1).numpy()

    avg = "weighted"
    metrics = {
        "acc":  float(accuracy_score(y_test, y_pred)),
        "prec": float(precision_score(y_test, y_pred, average=avg, zero_division=0)),
        "rec":  float(recall_score(y_test, y_pred, average=avg, zero_division=0)),
        "f1":   float(f1_score(y_test, y_pred, average=avg, zero_division=0)),
        "cm":   confusion_matrix(y_test, y_pred).tolist(),
    }

    training_history = {
        "loss":      loss_history,
        "accuracy":  acc_history,
        "epochs":    epochs,
        "framework": "pytorch",
    }

    task.update_state(state=states.STARTED, meta={"step": "Export du modele (.pt)"})
    model_key = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".pt", delete=False) as tmp:
            tmp_path = tmp.name
        torch.save(model.state_dict(), tmp_path)
        with open(tmp_path, "rb") as f:
            pt_bytes = f.read()
        os.unlink(tmp_path)
        model_key = f"models/experiment_{exp_id}_pytorch.pt"
        storage.upload(pt_bytes, model_key, "application/octet-stream")
    except Exception:
        pass

    return metrics, training_history, model_key

@celery_app.task(bind=True, name="train_model")
def train_model(self, experiment_id: int):
    from app.core.database import SessionLocal
    from app.models.experiment import Experiment, ExperimentStatus
    from app.models.dataset import Dataset
    from app.models.model import Model as MLModel
    from app.models.result import Result
    from app.services.storage_service import StorageService

    db = SessionLocal()
    try:
        exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
        if not exp:
            return {"error": f"Experience {experiment_id} introuvable"}

        exp.status = ExperimentStatus.RUNNING
        db.commit()
        self.update_state(state=states.STARTED, meta={"step": "Chargement des donnees"})

        dataset  = db.query(Dataset).filter(Dataset.id == exp.dataset_id).first()
        ml_model = db.query(MLModel).filter(MLModel.id == exp.model_id).first()

        storage = StorageService()
        response = storage.client.get_object(storage.bucket, dataset.minio_key)
        dataset_bytes = response.read()
        response.close()

        model_type = (ml_model.model_type or "sklearn").lower()

        if model_type == "computer_vision":
            metrics, training_history, model_key = _train_cv(
                self, dataset_bytes, ml_model, storage, exp.id
            )
        elif model_type == "audio":
            metrics, training_history, model_key = _train_audio(
                self, dataset_bytes, ml_model, storage, exp.id
            )
        elif model_type == "video":
            metrics, training_history, model_key = _train_video(
                self, dataset_bytes, ml_model, storage, exp.id
            )
        elif model_type == "tensorflow":
            metrics, training_history, model_key = _train_tf(
                self, dataset_bytes, ml_model, storage, exp.id
            )
        elif model_type == "pytorch":
            metrics, training_history, model_key = _train_pytorch(
                self, dataset_bytes, ml_model, storage, exp.id
            )
        else:
            metrics, training_history, model_key = _train_sklearn(
                self, dataset_bytes, ml_model, storage, exp.id
            )

        self.update_state(state=states.STARTED, meta={"step": "Sauvegarde des resultats"})

        existing = db.query(Result).filter(Result.experiment_id == exp.id).first()
        if existing:
            existing.accuracy         = metrics["acc"]
            existing.precision        = metrics["prec"]
            existing.recall           = metrics["rec"]
            existing.f1_score         = metrics["f1"]
            existing.confusion_matrix = metrics["cm"]
            existing.training_history = training_history
            existing.model_key        = model_key
        else:
            db.add(Result(
                experiment_id    = exp.id,
                accuracy         = metrics["acc"],
                precision        = metrics["prec"],
                recall           = metrics["rec"],
                f1_score         = metrics["f1"],
                confusion_matrix = metrics["cm"],
                training_history = training_history,
                model_key        = model_key,
            ))

        exp.status      = ExperimentStatus.COMPLETED
        exp.finished_at = datetime.now(timezone.utc)
        db.commit()

        # Versioning automatique : v1 initial, v2/v3/... a chaque re-entrainement
        try:
            completed_count = (
                db.query(Experiment)
                .filter(
                    Experiment.model_id == ml_model.id,
                    Experiment.status == ExperimentStatus.COMPLETED,
                )
                .count()
            )
            if completed_count <= 1:
                ml_model.version = "v1 - initial"
            else:
                ml_model.version = f"v{completed_count} - re-entrainement"
            db.commit()
        except Exception:
            pass

        return {
            "accuracy":   metrics["acc"],
            "f1":         metrics["f1"],
            "status":     "completed",
            "model_type": model_type,
        }

    except Exception as exc:
        try:
            exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
            if exp:
                exp.status      = ExperimentStatus.FAILED
                exp.finished_at = datetime.now(timezone.utc)
                db.commit()
        except Exception:
            pass
        raise exc
    finally:
        db.close()

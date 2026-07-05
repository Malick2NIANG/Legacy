"""
Migration one-shot : déplace les fichiers modèles de datasets/models/ → bucket models/
et met à jour les clés en base de données.

Usage (depuis le dossier backend/) :
    docker compose exec backend python migrate_models_bucket.py
"""
import os
import sys
import io

# ── Chargement de la config Django/FastAPI ─────────────────────────────────
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault("DATABASE_URL", "postgresql://ds_user:ds_password@postgres:5432/ds_platform")

from minio import Minio
from minio.error import S3Error
import sqlalchemy
from sqlalchemy import create_engine, text

# ── Paramètres (identiques à storage_service.py) ─────────────────────────
MINIO_ENDPOINT   = os.getenv("MINIO_ENDPOINT",   "minio:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
SRC_BUCKET       = "datasets"
DST_BUCKET       = "models"
DATABASE_URL     = os.getenv("DATABASE_URL", "postgresql://ds_user:ds_password@postgres:5432/ds_platform")


def main():
    client = Minio(MINIO_ENDPOINT, access_key=MINIO_ACCESS_KEY, secret_key=MINIO_SECRET_KEY, secure=False)

    # Créer le bucket destination si besoin
    if not client.bucket_exists(DST_BUCKET):
        client.make_bucket(DST_BUCKET)
        print(f"[+] Bucket '{DST_BUCKET}' créé.")

    # Lister les objets dans datasets/models/
    objects = list(client.list_objects(SRC_BUCKET, prefix="models/", recursive=True))
    if not objects:
        print("[!] Aucun fichier trouvé dans datasets/models/ — rien à migrer.")
        return

    print(f"[i] {len(objects)} fichier(s) à migrer...\n")

    engine = create_engine(DATABASE_URL)
    migrated = []

    for obj in objects:
        old_key = obj.object_name          # ex: models/experiment_5_cv_rf.pkl
        new_key = old_key[len("models/"):]  # ex: experiment_5_cv_rf.pkl
        size    = obj.size

        print(f"  → Copie  {old_key}  ({size // 1024} KiB)")
        print(f"       vers  {DST_BUCKET}/{new_key}")

        try:
            # Lire depuis datasets
            response = client.get_object(SRC_BUCKET, old_key)
            data = response.read()
            response.close()

            # Écrire dans models (sans préfixe)
            client.put_object(
                bucket_name=DST_BUCKET,
                object_name=new_key,
                data=io.BytesIO(data),
                length=len(data),
                content_type="application/octet-stream",
            )

            # Supprimer l'original
            client.remove_object(SRC_BUCKET, old_key)
            print(f"       ✓ Copié et supprimé de datasets/models/")

            migrated.append((old_key, new_key))

        except Exception as e:
            print(f"       ✗ Erreur : {e}")

    # Mettre à jour les clés en base
    if migrated:
        print(f"\n[i] Mise à jour de la base de données ({len(migrated)} ligne(s))...")
        with engine.connect() as conn:
            for old_key, new_key in migrated:
                result = conn.execute(
                    text("UPDATE results SET model_key = :new WHERE model_key = :old"),
                    {"new": new_key, "old": old_key},
                )
                print(f"  → results: '{old_key}' → '{new_key}'  ({result.rowcount} ligne(s) mise(s) à jour)")
            conn.commit()

    print(f"\n[✓] Migration terminée — {len(migrated)}/{len(objects)} fichier(s) migrés.")


if __name__ == "__main__":
    main()

"""
Endpoints de gestion des datasets.
CRUD complet + upload vers MinIO + récupération de métadonnées.
"""
import re
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.services.dataset_service import DatasetService
from app.services.storage_service import StorageService
from app.schemas.dataset import DatasetRead

router = APIRouter()


@router.get("/", response_model=List[DatasetRead])
def list_datasets(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Retourne la liste des datasets de l'utilisateur courant."""
    return DatasetService(db).get_all(owner_id=current_user.id)


@router.post("/", response_model=DatasetRead, status_code=status.HTTP_201_CREATED)
async def upload_dataset(
    file: UploadFile = File(...),
    name: str = Form(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Upload un fichier dataset vers MinIO et enregistre ses métadonnées en DB."""
    file_data = await file.read()
    svc     = DatasetService(db)
    version = svc.get_next_version(name, current_user.id)

    # Chemin lisible avec version : <nom>/v<N>/<fichier>
    safe_name   = re.sub(r'[^\w\-]', '_', name)
    object_name = f"{safe_name}/v{version}/{file.filename}"

    StorageService().upload(
        file_data=file_data,
        object_name=object_name,
        content_type=file.content_type or "application/octet-stream",
    )

    return svc.create(
        name=name,
        filename=file.filename,
        minio_key=object_name,
        owner_id=current_user.id,
        file_size=len(file_data),
        mimetype=file.content_type,
        version=version,
    )


@router.get("/{dataset_id}/url")
def get_dataset_url(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Génère une URL présignée pour télécharger le dataset."""
    dataset = DatasetService(db).get_by_id(dataset_id, current_user.id)
    url = StorageService().get_url(dataset.minio_key)
    return {"url": url}


@router.get("/{dataset_id}/download")
def download_dataset_file(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Stream le fichier dataset directement depuis MinIO — pas de presigned URL."""
    dataset = DatasetService(db).get_by_id(dataset_id, current_user.id)
    storage = StorageService()
    try:
        stream = storage.get_object_stream(dataset.minio_key)
        filename = dataset.filename or "dataset"
        return StreamingResponse(
            stream,
            media_type=dataset.mimetype or "application/octet-stream",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur de téléchargement : {e}")


@router.delete("/{dataset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Supprime un dataset (fichier MinIO + entrée DB)."""
    dataset = DatasetService(db).get_by_id(dataset_id, current_user.id)
    StorageService().delete(dataset.minio_key)
    DatasetService(db).delete(dataset_id, current_user.id)


@router.get("/{dataset_id}/preview")
def preview_dataset(
    dataset_id: int,
    rows: int = 5,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Retourne un apercu du dataset : colonnes, types, nb lignes, echantillon."""
    import io, pandas as pd
    from app.services.storage_service import StorageService
    dataset = DatasetService(db).get_by_id(dataset_id, current_user.id)
    try:
        storage  = StorageService()
        response = storage.client.get_object(storage.bucket, dataset.minio_key)
        df = pd.read_csv(io.BytesIO(response.read()))
        response.close()
        return {
            "row_count":  int(len(df)),
            "col_count":  int(len(df.columns)),
            "columns":    [
                {"name": col, "dtype": str(df[col].dtype), "null_count": int(df[col].isna().sum())}
                for col in df.columns
            ],
            "sample": df.head(rows).fillna("").astype(str).to_dict(orient="records"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Impossible de lire le dataset: {e}")

"""
Endpoints de gestion des datasets.
CRUD complet + upload vers MinIO + récupération de métadonnées.
"""
import uuid
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, Form, status
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
    object_name = f"datasets/{current_user.id}/{uuid.uuid4()}_{file.filename}"

    StorageService().upload(
        file_data=file_data,
        object_name=object_name,
        content_type=file.content_type or "application/octet-stream",
    )

    return DatasetService(db).create(
        name=name,
        filename=file.filename,
        minio_key=object_name,
        owner_id=current_user.id,
        file_size=len(file_data),
        mimetype=file.content_type,
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

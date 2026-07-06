"""
Endpoint utilitaire temporaire — sauvegarde de fichiers générés côté client.
"""
import base64
import os
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from app.api.deps import get_current_user

router = APIRouter()

SAVE_DIR = "/app"   # monté sur ./backend/ dans Docker


class FileSaveRequest(BaseModel):
    filename: str
    data_b64: str   # fichier encodé en base64


@router.post("/save-file")
def save_file(payload: FileSaveRequest, current_user=Depends(get_current_user)):
    """Reçoit un fichier en base64 depuis le navigateur et le sauvegarde sur disque."""
    try:
        raw = base64.b64decode(payload.data_b64)
        path = os.path.join(SAVE_DIR, payload.filename)
        with open(path, "wb") as f:
            f.write(raw)
        return {"status": "ok", "path": path, "size": len(raw)}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

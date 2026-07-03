"""
Endpoint d execution de scripts Python (Notebook simplifie).
Permet d executer du code Python cote serveur avec capture stdout/stderr.
"""
import os
import subprocess
import sys
import tempfile
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional
from app.api.deps import get_current_user

router = APIRouter()

# Modules Python autorises explicitement dans les scripts utilisateur
# (pas de restriction binaire : le subprocess Python systeme est utilise)

TIMEOUT_MAX = 60   # secondes max acceptees
TIMEOUT_DEF = 30


class ScriptInput(BaseModel):
    code: str = Field(..., min_length=1, max_length=50_000)
    timeout: Optional[int] = Field(default=TIMEOUT_DEF, ge=1, le=TIMEOUT_MAX)


class ScriptOutput(BaseModel):
    stdout: str
    stderr: str
    returncode: int
    truncated: bool = False


@router.post("/execute", response_model=ScriptOutput)
def execute_script(
    payload: ScriptInput,
    current_user=Depends(get_current_user),
):
    """
    Execute un script Python et retourne stdout + stderr.
    Timeout configurable (max 60 s).
    """
    timeout = min(payload.timeout or TIMEOUT_DEF, TIMEOUT_MAX)

    with tempfile.NamedTemporaryFile(
        suffix=".py", delete=False, mode="w", encoding="utf-8"
    ) as f:
        f.write(payload.code)
        tmp_path = f.name

    try:
        result = subprocess.run(
            [sys.executable, tmp_path],
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        stdout = result.stdout
        stderr = result.stderr
        truncated = False

        # Limite la taille de sortie pour eviter les reponses trop lourdes
        MAX_OUT = 50_000
        if len(stdout) > MAX_OUT:
            stdout = stdout[:MAX_OUT] + "\n... [sortie tronquee a 50 000 caracteres]"
            truncated = True
        if len(stderr) > MAX_OUT:
            stderr = stderr[:MAX_OUT] + "\n... [erreur tronquee a 50 000 caracteres]"
            truncated = True

        return ScriptOutput(
            stdout=stdout,
            stderr=stderr,
            returncode=result.returncode,
            truncated=truncated,
        )

    except subprocess.TimeoutExpired:
        return ScriptOutput(
            stdout="",
            stderr=f"TimeoutError : execution stoppee apres {timeout} secondes.",
            returncode=124,
        )
    except Exception as exc:
        return ScriptOutput(
            stdout="",
            stderr=f"Erreur interne : {exc}",
            returncode=1,
        )
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass

from fastapi import HTTPException, UploadFile
from backend.app.core.config import settings


def validate_image(file: UploadFile):
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in settings.allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {settings.allowed_extensions}",
        )

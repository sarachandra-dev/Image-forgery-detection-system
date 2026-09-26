import uuid
import os
import aiofiles
from fastapi import UploadFile
from backend.app.core.config import settings


async def save_upload(file: UploadFile) -> tuple[str, str]:
    """Save uploaded file, return (file_id, saved_path)."""
    os.makedirs(settings.upload_dir, exist_ok=True)
    ext = file.filename.rsplit(".", 1)[-1].lower()
    file_id = str(uuid.uuid4())
    path = os.path.join(settings.upload_dir, f"{file_id}.{ext}")

    async with aiofiles.open(path, "wb") as f:
        content = await file.read()
        await f.write(content)

    return file_id, path


def get_output_url(file_id: str, output_type: str) -> str:
    return f"/outputs/{output_type}/{file_id}.jpg"

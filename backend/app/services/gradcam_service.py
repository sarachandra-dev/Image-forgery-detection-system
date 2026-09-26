import os
from PIL import Image
from ml.localization.heatmap import save_heatmap
from backend.app.core.config import settings


def generate_heatmap(cam, image: Image.Image, file_id: str) -> str:
    os.makedirs(settings.heatmap_output_dir, exist_ok=True)
    save_path = os.path.join(settings.heatmap_output_dir, f"{file_id}.jpg")
    save_heatmap(cam, image, save_path)
    return save_path

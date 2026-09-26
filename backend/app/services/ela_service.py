import os
import numpy as np
from PIL import Image
from ml.preprocessing.ela import ela_from_pil
from backend.app.core.config import settings


def generate_ela(image: Image.Image, file_id: str) -> str:
    ela_arr = ela_from_pil(image)
    ela_image = Image.fromarray(ela_arr)

    os.makedirs(settings.ela_output_dir, exist_ok=True)
    save_path = os.path.join(settings.ela_output_dir, f"{file_id}.jpg")
    ela_image.save(save_path)
    return save_path

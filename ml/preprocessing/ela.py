import numpy as np
from PIL import Image
import io


def compute_ela(image_path: str, quality: int = 90, scale: int = 15) -> np.ndarray:
    """Compute Error Level Analysis for an image."""
    original = Image.open(image_path).convert("RGB")

    buffer = io.BytesIO()
    original.save(buffer, format="JPEG", quality=quality)
    buffer.seek(0)
    compressed = Image.open(buffer).convert("RGB")

    orig_arr = np.array(original, dtype=np.float32)
    comp_arr = np.array(compressed, dtype=np.float32)

    ela = np.abs(orig_arr - comp_arr) * scale
    ela = np.clip(ela, 0, 255).astype(np.uint8)
    return ela


def ela_from_pil(image: Image.Image, quality: int = 90, scale: int = 15) -> np.ndarray:
    """Compute ELA from a PIL Image object."""
    buffer = io.BytesIO()
    image.convert("RGB").save(buffer, format="JPEG", quality=quality)
    buffer.seek(0)
    compressed = Image.open(buffer).convert("RGB")

    orig_arr = np.array(image.convert("RGB"), dtype=np.float32)
    comp_arr = np.array(compressed, dtype=np.float32)

    ela = np.abs(orig_arr - comp_arr) * scale
    return np.clip(ela, 0, 255).astype(np.uint8)

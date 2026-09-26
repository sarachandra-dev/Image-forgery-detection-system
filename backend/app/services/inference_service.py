import os
import time
from PIL import Image
import numpy as np
from typing import Dict, Any, Optional

from backend.app.core.config import settings
from backend.app.core.model_loader import get_predictor
from ml.inference.predictor import ForgeryPredictor

_fallback_predictor: Optional[ForgeryPredictor] = None


def get_active_predictor() -> ForgeryPredictor:
    global _fallback_predictor
    pred = get_predictor()
    if pred is not None:
        return pred
    if _fallback_predictor is None:
        _fallback_predictor = ForgeryPredictor(weights_path=settings.model_weights_path, device=settings.device)
    return _fallback_predictor


def run_inference(image: Image.Image, file_id: str) -> Dict[str, Any]:
    """
    Execute full multi-modal forensic pipeline and save all visual artifacts.
    """
    start_time = time.perf_counter()
    predictor = get_active_predictor()

    result = predictor.predict_with_heatmap(image)
    duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

    # Ensure output directories exist
    os.makedirs(settings.ela_output_dir, exist_ok=True)
    os.makedirs(settings.heatmap_output_dir, exist_ok=True)
    os.makedirs(settings.noise_output_dir, exist_ok=True)
    os.makedirs(settings.mask_output_dir, exist_ok=True)

    # 1. Save ELA visualization
    ela_path = os.path.join(settings.ela_output_dir, f"{file_id}.jpg")
    Image.fromarray(result["ela_array"]).save(ela_path, quality=95)

    # 2. Save Heatmap visualization
    heatmap_path = os.path.join(settings.heatmap_output_dir, f"{file_id}.jpg")
    if isinstance(result.get("heatmap_image"), Image.Image):
        result["heatmap_image"].save(heatmap_path, quality=95)
    else:
        heatmap_path = None

    # 3. Save Noise Residual visualization
    noise_path = os.path.join(settings.noise_output_dir, f"{file_id}.jpg")
    if "noise_array" in result:
        Image.fromarray(result["noise_array"]).save(noise_path, quality=95)
    else:
        noise_path = None

    # 4. Save Binary Tamper Mask
    mask_path = os.path.join(settings.mask_output_dir, f"{file_id}.jpg")
    if "tamper_mask" in result:
        Image.fromarray(result["tamper_mask"]).save(mask_path, quality=95)
    else:
        mask_path = None

    return {
        "label": result["label"],
        "confidence": result["confidence"],
        "probabilities": result["probabilities"],
        "ela_path": ela_path,
        "heatmap_path": heatmap_path,
        "noise_path": noise_path,
        "mask_path": mask_path,
        "tamper_area_pct": result.get("tamper_area_pct", 0.0),
        "severity": result.get("severity", "Clean"),
        "regions": result.get("regions", []),
        "metrics": result.get("metrics", {}),
        "exif_summary": result.get("exif_summary", {}),
        "inference_time_ms": duration_ms,
    }

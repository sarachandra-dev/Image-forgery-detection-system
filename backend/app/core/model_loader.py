import os
from typing import Optional
from ml.inference.predictor import ForgeryPredictor
from backend.app.core.config import settings

_predictor: Optional[ForgeryPredictor] = None


def get_predictor() -> Optional[ForgeryPredictor]:
    return _predictor


def load_model():
    global _predictor
    if os.path.exists(settings.model_weights_path):
        _predictor = ForgeryPredictor(
            weights_path=settings.model_weights_path,
            device=settings.device,
        )
        print(f"[OK] Model loaded from {settings.model_weights_path}")
    else:
        print(f"[INFO] No weights found at {settings.model_weights_path}. Running with multi-modal forensic analyzer.")

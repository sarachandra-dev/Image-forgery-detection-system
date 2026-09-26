from fastapi import APIRouter
from backend.app.core.model_loader import get_predictor

router = APIRouter()


@router.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": get_predictor() is not None,
    }

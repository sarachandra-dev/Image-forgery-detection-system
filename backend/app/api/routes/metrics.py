import os
import sys
import time
import platform
import torch
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from backend.app.core.database import get_db, PredictionRecord
from backend.app.core.config import settings
from backend.app.core.model_loader import get_predictor

router = APIRouter()
_server_start_time = time.time()


@router.get("/metrics")
async def get_metrics(db: AsyncSession = Depends(get_db)):
    """
    Real-time DevOps Telemetry and System Health Metrics.
    """
    # Query database stats
    total_query = await db.execute(select(func.count(PredictionRecord.id)))
    total_scans = total_query.scalar() or 0

    forged_query = await db.execute(
        select(func.count(PredictionRecord.id)).where(PredictionRecord.label == "forged")
    )
    forged_scans = forged_query.scalar() or 0
    authentic_scans = total_scans - forged_scans

    avg_conf_query = await db.execute(select(func.avg(PredictionRecord.confidence)))
    avg_confidence = round(float(avg_conf_query.scalar() or 0.0), 3)

    uptime_sec = int(time.time() - _server_start_time)

    # Process memory
    try:
        import psutil
        process = psutil.Process(os.getpid())
        ram_mb = round(process.memory_info().rss / (1024 * 1024), 1)
        cpu_pct = process.cpu_percent(interval=None)
    except Exception:
        ram_mb = 128.0
        cpu_pct = 0.0

    return {
        "status": "healthy",
        "uptime_seconds": uptime_sec,
        "uptime_formatted": f"{uptime_sec // 3600}h {(uptime_sec % 3600) // 60}m {uptime_sec % 60}s",
        "system": {
            "os": f"{platform.system()} {platform.release()}",
            "python_version": sys.version.split()[0],
            "pytorch_version": torch.__version__,
            "device": settings.device,
            "cuda_available": torch.cuda.is_available(),
            "process_memory_mb": ram_mb,
            "cpu_percent": cpu_pct,
        },
        "model": {
            "name": "ResNet50 + ResNet34 Dual-Stream Fusion",
            "weights_path": settings.model_weights_path,
            "weights_exist": os.path.exists(settings.model_weights_path),
            "model_loaded": get_predictor() is not None,
            "gradcam_enabled": True,
            "forensics_modules": [
                "Error Level Analysis (ELA)",
                "Spatial Rich Model Noise Residual",
                "2D Fast Fourier Transform (FFT)",
                "EXIF Metadata Integrity & Software Detection",
                "Grad-CAM Saliency",
                "Morphological Tamper Bounding Box Localization",
            ],
        },
        "analytics": {
            "total_scans": total_scans,
            "authentic_scans": authentic_scans,
            "forged_scans": forged_scans,
            "forged_ratio_pct": round((forged_scans / total_scans) * 100, 1) if total_scans > 0 else 0.0,
            "average_confidence": avg_confidence,
        },
    }

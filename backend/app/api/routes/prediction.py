import os
import json
import hashlib
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from PIL import Image
import io

from backend.app.core.database import get_db, PredictionRecord, utc_now
from backend.app.services.inference_service import run_inference
from backend.app.utils.file_utils import save_upload, get_output_url
from backend.app.utils.validation import validate_image
from backend.app.schemas.prediction import (
    PredictionResponse,
    Probabilities,
    TamperRegion,
    ForensicMetrics,
    ExifSummary,
)

router = APIRouter()


@router.post("/predict", response_model=PredictionResponse)
async def predict(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    validate_image(file)
    file_id, saved_path = await save_upload(file)

    # Compute SHA-256 for cryptographic evidence
    with open(saved_path, "rb") as f:
        sha256_hash = hashlib.sha256(f.read()).hexdigest()

    try:
        image = Image.open(saved_path).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cannot decode image file: {str(e)}")

    result = run_inference(image, file_id)

    ela_url = get_output_url(file_id, "ela") if result.get("ela_path") else None
    heatmap_url = get_output_url(file_id, "heatmaps") if result.get("heatmap_path") else None
    noise_url = get_output_url(file_id, "noise") if result.get("noise_path") else None
    mask_url = get_output_url(file_id, "masks") if result.get("mask_path") else None

    record = PredictionRecord(
        filename=file.filename or "unknown",
        label=result["label"],
        confidence=result["confidence"],
        prob_authentic=result["probabilities"]["authentic"],
        prob_forged=result["probabilities"]["forged"],
        ela_path=result.get("ela_path"),
        heatmap_path=result.get("heatmap_path"),
        noise_path=result.get("noise_path"),
        mask_path=result.get("mask_path"),
        sha256=sha256_hash,
        tamper_area_pct=result.get("tamper_area_pct", 0.0),
        severity=result.get("severity", "Clean"),
        metrics_json=json.dumps(result.get("metrics", {})),
        regions_json=json.dumps(result.get("regions", [])),
        created_at=utc_now(),
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)

    # Format regions
    regions = [TamperRegion(**r) for r in result.get("regions", [])]
    metrics = ForensicMetrics(**result["metrics"]) if result.get("metrics") else None
    exif = ExifSummary(**result["exif_summary"]) if result.get("exif_summary") else None

    return PredictionResponse(
        id=record.id,
        filename=record.filename,
        label=result["label"],
        confidence=result["confidence"],
        probabilities=Probabilities(**result["probabilities"]),
        ela_url=ela_url,
        heatmap_url=heatmap_url,
        noise_url=noise_url,
        mask_url=mask_url,
        sha256=sha256_hash,
        tamper_area_pct=result.get("tamper_area_pct", 0.0),
        severity=result.get("severity", "Clean"),
        regions=regions,
        metrics=metrics,
        exif_summary=exif,
        inference_time_ms=result.get("inference_time_ms", 0.0),
        created_at=record.created_at,
    )

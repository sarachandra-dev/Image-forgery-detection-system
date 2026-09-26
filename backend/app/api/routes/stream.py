import asyncio
import base64
import json
import uuid
import os
import hashlib
from io import BytesIO
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from PIL import Image

from backend.app.core.config import settings
from backend.app.core.database import AsyncSessionLocal, PredictionRecord, utc_now
from backend.app.services.inference_service import get_active_predictor
from backend.app.utils.file_utils import get_output_url
from ml.forensics.analyzer import ForensicAnalyzer

router = APIRouter()


@router.websocket("/ws/analyze")
async def websocket_analyze(websocket: WebSocket):
    await websocket.accept()
    try:
        data = await websocket.receive_text()
        msg = json.loads(data)
        base64_data = msg.get("image_base64", "")
        filename = msg.get("filename", "live_capture.jpg")

        if not base64_data:
            await websocket.send_json({"error": "No image data provided"})
            await websocket.close()
            return

        # Strip data URL header if present
        if "," in base64_data:
            base64_data = base64_data.split(",", 1)[1]

        image_bytes = base64.b64decode(base64_data)
        file_id = str(uuid.uuid4())
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"
        save_path = os.path.join(settings.upload_dir, f"{file_id}.{ext}")

        os.makedirs(settings.upload_dir, exist_ok=True)
        with open(save_path, "wb") as f:
            f.write(image_bytes)

        # Stage 1: Hash calculation
        await websocket.send_json({
            "step": 1,
            "stage": "Cryptographic Integrity",
            "progress": 15,
            "detail": "Generated SHA-256 digital forensic fingerprint",
        })
        sha256_hash = hashlib.sha256(image_bytes).hexdigest()
        await asyncio.sleep(0.08)

        # Stage 2: EXIF & Metadata
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        analyzer = ForensicAnalyzer()
        await websocket.send_json({
            "step": 2,
            "stage": "Metadata & EXIF Forensics",
            "progress": 30,
            "detail": "Examining camera hardware provenance & software tags...",
        })
        exif_summary = analyzer.analyze_exif(image)
        await asyncio.sleep(0.08)

        # Stage 3: Error Level Analysis
        await websocket.send_json({
            "step": 3,
            "stage": "Error Level Analysis (ELA)",
            "progress": 50,
            "detail": "Computing quantization discrepancy and compression anomalies...",
        })
        await asyncio.sleep(0.08)

        # Stage 4: Noise Print & 2D FFT
        await websocket.send_json({
            "step": 4,
            "stage": "Spatial Noise & 2D FFT Spectrum",
            "progress": 70,
            "detail": "Analyzing sensor pattern noise residual & resampling artifacts...",
        })
        await asyncio.sleep(0.08)

        # Stage 5: Dual-Stream Deep Learning & Grad-CAM
        await websocket.send_json({
            "step": 5,
            "stage": "Deep Fusion CNN & Grad-CAM",
            "progress": 85,
            "detail": "Running ResNet50/34 feature stream and gradient localization...",
        })
        predictor = get_active_predictor()
        result = predictor.predict_with_heatmap(image)

        # Save outputs
        os.makedirs(settings.ela_output_dir, exist_ok=True)
        os.makedirs(settings.heatmap_output_dir, exist_ok=True)
        os.makedirs(settings.noise_output_dir, exist_ok=True)
        os.makedirs(settings.mask_output_dir, exist_ok=True)

        ela_path = os.path.join(settings.ela_output_dir, f"{file_id}.jpg")
        Image.fromarray(result["ela_array"]).save(ela_path, quality=95)

        heatmap_path = os.path.join(settings.heatmap_output_dir, f"{file_id}.jpg")
        if isinstance(result.get("heatmap_image"), Image.Image):
            result["heatmap_image"].save(heatmap_path, quality=95)

        noise_path = os.path.join(settings.noise_output_dir, f"{file_id}.jpg")
        if "noise_array" in result:
            Image.fromarray(result["noise_array"]).save(noise_path, quality=95)

        mask_path = os.path.join(settings.mask_output_dir, f"{file_id}.jpg")
        if "tamper_mask" in result:
            Image.fromarray(result["tamper_mask"]).save(mask_path, quality=95)

        # Stage 6: Tamper Localization
        await websocket.send_json({
            "step": 6,
            "stage": "Tamper Region Segmentation",
            "progress": 95,
            "detail": f"Localized {len(result.get('regions', []))} suspicious regions ({result.get('tamper_area_pct', 0)}% area)",
        })
        await asyncio.sleep(0.05)

        # Save to database
        record_id = 0
        try:
            async with AsyncSessionLocal() as db:
                record = PredictionRecord(
                    filename=filename,
                    label=result["label"],
                    confidence=result["confidence"],
                    prob_authentic=result["probabilities"]["authentic"],
                    prob_forged=result["probabilities"]["forged"],
                    ela_path=ela_path,
                    heatmap_path=heatmap_path,
                    noise_path=noise_path,
                    mask_path=mask_path,
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
                record_id = record.id
        except Exception:
            pass

        # Final Result
        ela_url = get_output_url(file_id, "ela")
        heatmap_url = get_output_url(file_id, "heatmaps")
        noise_url = get_output_url(file_id, "noise")
        mask_url = get_output_url(file_id, "masks")

        await websocket.send_json({
            "step": 7,
            "stage": "Completed",
            "progress": 100,
            "result": {
                "id": record_id,
                "filename": filename,
                "label": result["label"],
                "confidence": result["confidence"],
                "probabilities": result["probabilities"],
                "ela_url": ela_url,
                "heatmap_url": heatmap_url,
                "noise_url": noise_url,
                "mask_url": mask_url,
                "sha256": sha256_hash,
                "tamper_area_pct": result.get("tamper_area_pct", 0.0),
                "severity": result.get("severity", "Clean"),
                "regions": result.get("regions", []),
                "metrics": result.get("metrics", {}),
                "exif_summary": result.get("exif_summary", {}),
            },
        })

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"error": str(e)})
        except Exception:
            pass

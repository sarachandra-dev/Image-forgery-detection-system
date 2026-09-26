from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List, Dict, Any


class Probabilities(BaseModel):
    authentic: float
    forged: float


class TamperRegion(BaseModel):
    id: int
    x: int
    y: int
    width: int
    height: int
    x_pct: float
    y_pct: float
    w_pct: float
    h_pct: float
    confidence: float
    area_pct: float
    severity: str


class ForensicMetrics(BaseModel):
    ela_score: float
    ela_mean: float
    ela_hotspot_ratio: float
    noise_inconsistency: float
    frequency_anomaly: float
    metadata_risk: float
    neural_confidence: float


class ExifSummary(BaseModel):
    camera_metadata_found: bool
    editing_software_detected: bool
    software_name: Optional[str] = None
    suspicious_flags: List[str] = []
    metadata_risk_score: float
    tag_count: int = 0
    camera_model: Optional[str] = None
    camera_make: Optional[str] = None


class PredictionResponse(BaseModel):
    id: int
    filename: str
    label: str
    confidence: float
    probabilities: Probabilities
    ela_url: Optional[str] = None
    heatmap_url: Optional[str] = None
    noise_url: Optional[str] = None
    mask_url: Optional[str] = None
    sha256: Optional[str] = None
    tamper_area_pct: Optional[float] = 0.0
    severity: Optional[str] = "Clean"
    regions: List[TamperRegion] = []
    metrics: Optional[ForensicMetrics] = None
    exif_summary: Optional[ExifSummary] = None
    inference_time_ms: Optional[float] = 0.0
    created_at: datetime


class HistoryItem(BaseModel):
    id: int
    filename: str
    label: str
    confidence: float
    tamper_area_pct: Optional[float] = 0.0
    severity: Optional[str] = "Clean"
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

export interface Probabilities {
  authentic: number;
  forged: number;
}

export interface TamperRegion {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  x_pct: number;
  y_pct: number;
  w_pct: number;
  h_pct: number;
  confidence: number;
  area_pct: number;
  severity: "Critical" | "High" | "Moderate" | "Low";
}

export interface ForensicMetrics {
  ela_score: number;
  ela_mean: number;
  ela_hotspot_ratio: number;
  noise_inconsistency: number;
  frequency_anomaly: number;
  metadata_risk: number;
  neural_confidence: number;
}

export interface ExifSummary {
  camera_metadata_found: boolean;
  editing_software_detected: boolean;
  software_name?: string | null;
  suspicious_flags: string[];
  metadata_risk_score: number;
  tag_count: number;
  camera_model?: string | null;
  camera_make?: string | null;
}

export interface PredictionResult {
  id: number;
  filename: string;
  label: "authentic" | "forged";
  confidence: number;
  probabilities: Probabilities;
  ela_url: string | null;
  heatmap_url: string | null;
  noise_url: string | null;
  mask_url: string | null;
  sha256?: string | null;
  tamper_area_pct?: number;
  severity?: "Clean" | "Low" | "Moderate" | "High" | "Critical";
  regions?: TamperRegion[];
  metrics?: ForensicMetrics | null;
  exif_summary?: ExifSummary | null;
  inference_time_ms?: number;
  created_at: string;
}

export interface HistoryItem {
  id: number;
  filename: string;
  label: "authentic" | "forged";
  confidence: number;
  tamper_area_pct?: number;
  severity?: string;
  created_at: string;
}

export interface SampleItem {
  id: string;
  title: string;
  category: "authentic" | "forged";
  description: string;
  filename: string;
  url: string;
}

export interface DevOpsMetrics {
  status: string;
  uptime_seconds: number;
  uptime_formatted: string;
  system: {
    os: string;
    python_version: string;
    pytorch_version: string;
    device: string;
    cuda_available: boolean;
    process_memory_mb: number;
    cpu_percent: number;
  };
  model: {
    name: string;
    weights_path: string;
    weights_exist: boolean;
    model_loaded: boolean;
    gradcam_enabled: boolean;
    forensics_modules: string[];
  };
  analytics: {
    total_scans: number;
    authentic_scans: number;
    forged_scans: number;
    forged_ratio_pct: number;
    average_confidence: number;
  };
}

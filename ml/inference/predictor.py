import os
import torch
import cv2
import numpy as np
from PIL import Image
from typing import Dict, Any, Optional

from ml.models.fusion_model import FusionModel
from ml.preprocessing.ela import ela_from_pil
from ml.preprocessing.image_preprocess import preprocess_rgb, preprocess_ela
from ml.localization.gradcam import GradCAM
from ml.localization.heatmap import cam_to_heatmap
from ml.forensics.analyzer import ForensicAnalyzer


class ForgeryPredictor:
    """
    State-of-the-Art Multi-Modal Image Forgery Predictor.
    Pipeline:
      1. Calibrated ELA (higher-order kurtosis/skew scoring)
      2. Spatial Noise SRM Residual
      3. 2D FFT Frequency Spectrum
      4. EXIF Metadata Provenance
      5. Dual-Stream ResNet50 + ResNet34 Fusion + Grad-CAM
      6. Morphological Tamper Region Localization
      7. Calibrated Ensemble Decision (ELA-dominant)
    """

    def __init__(self, weights_path: Optional[str] = None, device: str = "cpu"):
        self.device = torch.device(device)
        self.forensic_analyzer = ForensicAnalyzer()
        self.model: Optional[FusionModel] = None
        self.gradcam: Optional[GradCAM] = None

        try:
            self.model = FusionModel(pretrained=True).to(self.device)
            if weights_path and os.path.exists(weights_path):
                self.model.load_state_dict(
                    torch.load(weights_path, map_location=self.device, weights_only=True)
                )
                print(f"[OK] FusionModel loaded from {weights_path}")
            else:
                print("[INFO] Pretrained backbone loaded without fine-tuned classifier.")
            self.model.eval()

            # Grad-CAM via model property for cleaner access
            target_layer = self.model.target_cam_layer
            self.gradcam = GradCAM(self.model, target_layer)
        except Exception as e:
            print(f"[WARN] Could not initialize FusionModel ({e}). Using forensic fallback only.")
            self.model = None
            self.gradcam = None

    @torch.no_grad()
    def predict(self, image: Image.Image) -> Dict[str, Any]:
        """Fast prediction (no heatmap saved)."""
        res = self.predict_with_heatmap(image)
        return {
            "label": res["label"],
            "confidence": res["confidence"],
            "probabilities": res["probabilities"],
            "ela_array": res["ela_array"],
        }

    def predict_with_heatmap(self, image: Image.Image) -> Dict[str, Any]:
        """
        Full 7-stage forensic pipeline:
        1. ELA  2. Noise SRM  3. FFT  4. EXIF  5. Neural+GradCAM  6. Localization  7. Ensemble
        """
        orig_w, orig_h = image.size

        # ── Stage 1: Calibrated ELA ──────────────────────────────────────────────
        ela_arr, ela_metrics = self.forensic_analyzer.analyze_ela(image)
        ela_score = ela_metrics["ela_score"]                # 0.0–1.0 calibrated

        # ── Stage 2: Noise SRM Residual ─────────────────────────────────────────
        noise_arr, noise_metrics = self.forensic_analyzer.analyze_noise(image)
        noise_score = noise_metrics["noise_score"]

        # ── Stage 3: 2D FFT Spectrum ─────────────────────────────────────────────
        freq_metrics = self.forensic_analyzer.analyze_frequency(image)
        freq_score = freq_metrics["frequency_anomaly_score"]

        # ── Stage 4: EXIF Metadata ───────────────────────────────────────────────
        exif_summary = self.forensic_analyzer.analyze_exif(image)
        exif_risk = exif_summary["metadata_risk_score"]

        # ── Stage 5: Neural Deep Stream + Grad-CAM ───────────────────────────────
        neural_prob_forged = ela_score   # safe ELA-based fallback
        cam = None

        if self.model is not None and self.gradcam is not None:
            try:
                ela_tensor = preprocess_ela(ela_arr).unsqueeze(0).to(self.device)
                rgb_tensor = preprocess_rgb(image).unsqueeze(0).to(self.device)

                with torch.enable_grad():
                    logits = self.model(rgb_tensor, ela_tensor)
                    probs = torch.softmax(logits, dim=1).squeeze().detach()
                    neural_prob_forged = float(
                        probs[1] if probs.ndim > 0 and probs.shape[0] > 1 else probs
                    )
                    # Grad-CAM for class 1 (forged)
                    cam = self.gradcam.generate(rgb_tensor, ela_tensor, class_idx=1)
            except Exception as e:
                print(f"[GradCAM notice] {e}")
                cam = None

        # ── Fallback Synthetic CAM from ELA + Noise ─────────────────────────────
        if cam is None:
            ela_gray = cv2.cvtColor(ela_arr, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255.0
            noise_gray = cv2.cvtColor(noise_arr, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255.0
            cam = 0.65 * ela_gray + 0.35 * noise_gray
            cam = cv2.resize(cam, (224, 224), interpolation=cv2.INTER_AREA)
            if cam.max() > cam.min():
                cam = (cam - cam.min()) / (cam.max() - cam.min())

        # ── Stage 6: Morphological Tamper Region Localization ────────────────────
        # Pass the calibrated ELA score so the localizer knows whether to hunt for regions
        ela_preliminary = float(
            0.55 * ela_score + 0.25 * noise_score + 0.20 * neural_prob_forged
        )
        tamper_mask, regions, tamper_area_pct = self.forensic_analyzer.localize_tamper_regions(
            image_shape=(orig_h, orig_w),
            cam_map=cam,
            ela_gray=cv2.cvtColor(ela_arr, cv2.COLOR_RGB2GRAY),
            noise_gray=cv2.cvtColor(noise_arr, cv2.COLOR_RGB2GRAY),
            threshold=0.46,
            anomaly_score=ela_preliminary,
        )

        # ── Stage 7: Calibrated Ensemble Decision ────────────────────────────────
        # Weights designed on kurtosis-calibrated ELA and real tamper detection data:
        #   ELA Score  (35%) — primary signal: calibrated kurtosis/ratio anomaly
        #   Neural CNN (30%) — ResNet50/34 fusion prediction
        #   Noise SRM  (15%) — flat-block inconsistency
        #   FFT        (10%) — frequency spike detection
        #   EXIF       (10%) — metadata provenance risk
        region_boost = 0.12 if len(regions) > 0 and tamper_area_pct > 2.0 else 0.0

        ensemble_forged = float(np.clip(
            0.35 * ela_score
            + 0.30 * neural_prob_forged
            + 0.15 * noise_score
            + 0.10 * freq_score
            + 0.10 * exif_risk
            + region_boost,
            0.01, 0.99
        ))

        ensemble_authentic = float(round(1.0 - ensemble_forged, 4))
        ensemble_forged = float(round(ensemble_forged, 4))

        is_forged = ensemble_forged >= 0.50
        label = "forged" if is_forged else "authentic"
        confidence = ensemble_forged if is_forged else ensemble_authentic

        # Severity
        if not is_forged:
            severity = "Clean"
        elif ensemble_forged > 0.85 or tamper_area_pct > 20.0:
            severity = "Critical"
        elif ensemble_forged > 0.68 or tamper_area_pct > 8.0:
            severity = "High"
        elif ensemble_forged > 0.52 or tamper_area_pct > 2.0:
            severity = "Moderate"
        else:
            severity = "Low"

        heatmap_image = cam_to_heatmap(cam, image, alpha=0.55)

        return {
            "label": label,
            "confidence": float(round(confidence, 4)),
            "probabilities": {
                "authentic": ensemble_authentic,
                "forged": ensemble_forged,
            },
            "ela_array": ela_arr,
            "noise_array": noise_arr,
            "heatmap_image": heatmap_image,
            "tamper_mask": tamper_mask,
            "cam": cam,
            "tamper_area_pct": tamper_area_pct,
            "severity": severity,
            "regions": regions,
            "metrics": {
                "ela_score": ela_score,
                "ela_mean": ela_metrics["mean_error"],
                "ela_kurtosis": ela_metrics.get("kurtosis", 0.0),
                "ela_hotspot_ratio": ela_metrics["hotspot_ratio"],
                "noise_inconsistency": noise_metrics["noise_inconsistency"],
                "frequency_anomaly": freq_score,
                "metadata_risk": exif_risk,
                "neural_confidence": round(neural_prob_forged, 4),
            },
            "exif_summary": exif_summary,
        }

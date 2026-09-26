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
    Integrates Deep Learning (ResNet50 + ResNet34 Fusion), Grad-CAM Saliency,
    Error Level Analysis (ELA), Noise Print / SRM Residuals, 2D FFT Spectrum,
    and Morphological Tamper Region Localization.
    """

    def __init__(self, weights_path: Optional[str] = None, device: str = "cpu"):
        self.device = torch.device(device)
        self.forensic_analyzer = ForensicAnalyzer()
        self.model: Optional[FusionModel] = None
        self.gradcam: Optional[GradCAM] = None

        try:
            self.model = FusionModel(pretrained=True).to(self.device)
            if weights_path and os.path.exists(weights_path):
                self.model.load_state_dict(torch.load(weights_path, map_location=self.device))
                print(f"[OK] FusionModel loaded from {weights_path}")
            else:
                print("[INFO] Pretrained backbone loaded without fine-tuned classifier.")
            self.model.eval()

            # Target layer for Grad-CAM: last bottleneck layer in RGB stream
            target_layer = list(self.model.rgb_stream[-2].children())[-1]
            self.gradcam = GradCAM(self.model, target_layer)
        except Exception as e:
            print(f"[WARN] Could not initialize neural FusionModel ({e}). Using forensic analyzer fallback.")
            self.model = None
            self.gradcam = None

    @torch.no_grad()
    def predict(self, image: Image.Image) -> Dict[str, Any]:
        """Fast prediction without heatmap."""
        res = self.predict_with_heatmap(image)
        return {
            "label": res["label"],
            "confidence": res["confidence"],
            "probabilities": res["probabilities"],
            "ela_array": res["ela_array"],
        }

    def predict_with_heatmap(self, image: Image.Image) -> Dict[str, Any]:
        """
        Comprehensive forensic examination:
        1. Multi-scale Error Level Analysis
        2. Spatial Noise Residual Analysis
        3. 2D FFT Frequency Spectrum
        4. EXIF Metadata Tampering Check
        5. Deep Feature Activation & Grad-CAM
        6. Morphological Bounding Box Localization
        7. Ensemble Calibrated Decision
        """
        orig_w, orig_h = image.size

        # 1. Forensic ELA Analysis
        ela_arr, ela_metrics = self.forensic_analyzer.analyze_ela(image)

        # 2. Forensic Noise Residual Analysis
        noise_arr, noise_metrics = self.forensic_analyzer.analyze_noise(image)

        # 3. Frequency Domain Analysis
        freq_metrics = self.forensic_analyzer.analyze_frequency(image)

        # 4. EXIF Metadata Forensics
        exif_summary = self.forensic_analyzer.analyze_exif(image)

        # 5. Neural Deep Stream + Grad-CAM
        neural_prob_forged = 0.5
        cam = None

        if self.model is not None and self.gradcam is not None:
            try:
                rgb_tensor = preprocess_rgb(image).unsqueeze(0).to(self.device)
                ela_tensor = preprocess_ela(ela_arr).unsqueeze(0).to(self.device)
                rgb_tensor.requires_grad_(True)

                logits = self.model(rgb_tensor, ela_tensor)
                probs = torch.softmax(logits, dim=1).squeeze().detach().cpu().numpy()
                neural_prob_forged = float(probs[1]) if len(probs.shape) > 0 and probs.shape[0] > 1 else float(probs)

                # Class 1 is 'forged'
                cam = self.gradcam.generate(rgb_tensor, ela_tensor, class_idx=1)
            except Exception as e:
                print(f"GradCAM computation notice: {e}")
                cam = None

        # Fallback CAM if neural fails: synthesize from ELA & Noise
        if cam is None:
            ela_gray = cv2.cvtColor(ela_arr, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255.0
            noise_gray = cv2.cvtColor(noise_arr, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255.0
            cam = 0.6 * ela_gray + 0.4 * noise_gray
            cam = cv2.resize(cam, (224, 224), interpolation=cv2.INTER_AREA)
            cam = (cam - cam.min()) / max(cam.max() - cam.min(), 1e-4)

        # 6. Morphological Tamper Region Extraction
        tamper_mask, regions, tamper_area_pct = self.forensic_analyzer.localize_tamper_regions(
            image_shape=(orig_h, orig_w),
            cam_map=cam,
            ela_gray=cv2.cvtColor(ela_arr, cv2.COLOR_RGB2GRAY),
            noise_gray=cv2.cvtColor(noise_arr, cv2.COLOR_RGB2GRAY),
            threshold=0.52,
        )

        # 7. Multi-Disciplinary Calibrated Ensemble Scoring
        # Combines Neural Probability, ELA Discrepancy, Noise Inconsistency, FFT Anomaly, and EXIF Risk
        ela_score = ela_metrics["ela_score"]
        noise_score = noise_metrics["noise_score"]
        freq_score = freq_metrics["frequency_anomaly_score"]
        exif_risk = exif_summary["metadata_risk_score"]

        # If tamper regions exist with high localized area, elevate score
        region_boost = 0.15 if len(regions) > 0 and tamper_area_pct > 1.5 else 0.0

        ensemble_forged_score = (
            0.35 * neural_prob_forged
            + 0.25 * ela_score
            + 0.20 * noise_score
            + 0.10 * freq_score
            + 0.10 * exif_risk
            + region_boost
        )
        ensemble_forged_score = float(np.clip(ensemble_forged_score, 0.01, 0.99))
        ensemble_authentic_score = float(round(1.0 - ensemble_forged_score, 4))
        ensemble_forged_score = float(round(ensemble_forged_score, 4))

        is_forged = ensemble_forged_score >= 0.50
        label = "forged" if is_forged else "authentic"
        confidence = ensemble_forged_score if is_forged else ensemble_authentic_score

        # Severity determination
        if not is_forged or tamper_area_pct < 0.5:
            severity = "Clean" if ensemble_forged_score < 0.3 else "Low"
        elif ensemble_forged_score > 0.80 or tamper_area_pct > 25.0:
            severity = "Critical"
        elif ensemble_forged_score > 0.65 or tamper_area_pct > 10.0:
            severity = "High"
        else:
            severity = "Moderate"

        heatmap_image = cam_to_heatmap(cam, image, alpha=0.55)

        return {
            "label": label,
            "confidence": float(round(confidence, 4)),
            "probabilities": {
                "authentic": ensemble_authentic_score,
                "forged": ensemble_forged_score,
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
                "ela_hotspot_ratio": ela_metrics["hotspot_ratio"],
                "noise_inconsistency": noise_metrics["noise_inconsistency"],
                "frequency_anomaly": freq_score,
                "metadata_risk": exif_risk,
                "neural_confidence": round(neural_prob_forged, 4),
            },
            "exif_summary": exif_summary,
        }

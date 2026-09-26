"""
Advanced Multi-Factor Digital Image Forensics Analyzer.
Combines Error Level Analysis (ELA), Noise Residual (SRM), 2D Fourier (FFT) Analysis,
EXIF Metadata Provenance, and Morphological Tamper Region Localization.
"""

import io
import hashlib
from typing import Dict, Any, List, Tuple, Optional
import numpy as np
import cv2
from PIL import Image, ExifTags
from scipy.stats import kurtosis, skew


class ForensicAnalyzer:
    """Performs multi-disciplinary forensic examination on digital images."""

    def __init__(self, ela_quality: int = 90, ela_scale: int = 15):
        self.ela_quality = ela_quality
        self.ela_scale = ela_scale

    @staticmethod
    def compute_sha256(image_bytes: bytes) -> str:
        """Compute cryptographic SHA-256 hash of image data."""
        return hashlib.sha256(image_bytes).hexdigest()

    def analyze_ela(self, image: Image.Image, quality: Optional[int] = None, scale: Optional[int] = None) -> Tuple[np.ndarray, Dict[str, float]]:
        """
        Compute Error Level Analysis (ELA) and calculate higher-order statistical metrics.
        Detects compression quantization discrepancies, kurtosis anomaly, and localized spikes.
        Returns:
            ela_rgb: (H, W, 3) uint8 image representing ELA error
            metrics: dict of statistical anomalies and calibrated score
        """
        q = quality if quality is not None else self.ela_quality
        s = scale if scale is not None else self.ela_scale

        rgb_img = image.convert("RGB")
        orig_arr = np.array(rgb_img, dtype=np.float32)

        buffer = io.BytesIO()
        rgb_img.save(buffer, format="JPEG", quality=q)
        buffer.seek(0)
        compressed = Image.open(buffer).convert("RGB")
        comp_arr = np.array(compressed, dtype=np.float32)

        # Difference scaled
        diff = np.abs(orig_arr - comp_arr)
        ela_scaled = np.clip(diff * s, 0, 255).astype(np.uint8)

        # Statistical properties
        diff_gray = np.mean(diff, axis=2)
        diff_flat = diff_gray.flatten()

        mean_err = float(np.mean(diff_flat))
        std_err = float(np.std(diff_flat))
        max_err = float(np.max(diff_flat))
        p95_err = float(np.percentile(diff_flat, 95))
        p99_err = float(np.percentile(diff_flat, 99))

        # Higher-order statistical moments
        k = float(kurtosis(diff_flat))
        sk = float(skew(diff_flat))
        max_ratio = float(max_err / max(mean_err, 0.05))
        p99_ratio = float(p99_err / max(mean_err, 0.05))

        # Hotspots above mean + 2.0*std
        hotspot_threshold = mean_err + 2.0 * max(std_err, 1e-4)
        hotspot_ratio = float(np.mean(diff_gray > hotspot_threshold))

        # Calibrated ELA Anomaly Score
        # Authentic: kurtosis < 3.5, max_ratio < 8.0, p99_ratio < 4.0 -> score ~ 0.0 - 0.20
        # Forged (spliced/cloned/retouched): kurtosis > 12.0, max_ratio > 18.0 -> score ~ 0.70 - 1.0
        k_term = float(np.clip((k - 3.5) / 12.0, 0.0, 1.0))
        ratio_term = float(np.clip((max_ratio - 8.5) / 14.0, 0.0, 1.0))
        p99_term = float(np.clip((p99_ratio - 4.2) / 5.5, 0.0, 1.0))

        ela_score = float(np.clip(0.40 * k_term + 0.35 * ratio_term + 0.25 * p99_term, 0.0, 1.0))

        metrics = {
            "mean_error": round(mean_err, 2),
            "std_error": round(std_err, 2),
            "max_error": round(max_err, 2),
            "p95_error": round(p95_err, 2),
            "p99_error": round(p99_err, 2),
            "kurtosis": round(k, 2),
            "skewness": round(sk, 2),
            "max_ratio": round(max_ratio, 2),
            "hotspot_ratio": round(hotspot_ratio * 100, 2),
            "ela_score": round(ela_score, 3),
        }
        return ela_scaled, metrics

    def analyze_noise(self, image: Image.Image) -> Tuple[np.ndarray, Dict[str, float]]:
        """
        Spatial Rich Model / Median Filter Residual analysis.
        Extracts high-frequency sensor noise and analyzes noise variance consistency
        specifically across homogeneous / low-gradient regions to avoid texture confounding.
        Returns:
            noise_map_rgb: (H, W, 3) uint8 visualization of high-frequency noise
            metrics: noise variance metrics
        """
        rgb_arr = np.array(image.convert("RGB"))
        gray = cv2.cvtColor(rgb_arr, cv2.COLOR_RGB2GRAY)
        h, w = gray.shape

        # 3x3 median filter residual: R = |I - median(I)|
        median = cv2.medianBlur(gray, 3)
        residual = cv2.absdiff(gray, median).astype(np.float32)

        # Sobel gradient to identify low-contrast / flat blocks
        sobelx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
        sobely = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
        grad = np.sqrt(sobelx**2 + sobely**2)

        block_size = 16
        flat_block_vars = []
        all_block_vars = []

        for y in range(0, h - block_size + 1, block_size):
            for x in range(0, w - block_size + 1, block_size):
                res_block = residual[y : y + block_size, x : x + block_size]
                grad_block = grad[y : y + block_size, x : x + block_size]
                v = float(np.var(res_block))
                all_block_vars.append(v)
                if np.mean(grad_block) < 20.0:  # Homogeneous patch
                    flat_block_vars.append(v)

        # If sufficient flat blocks exist, evaluate sensor noise consistency on them
        eval_vars = flat_block_vars if len(flat_block_vars) >= 6 else all_block_vars

        if len(eval_vars) > 0:
            var_mean = float(np.mean(eval_vars))
            var_std = float(np.std(eval_vars))
            # Normal authentic sensor noise across flat regions has std/mean < 1.2
            inconsistency = float(np.clip((var_std / max(var_mean, 1e-2) - 0.8) / 2.2, 0.0, 1.0))
        else:
            var_mean = 0.0
            var_std = 0.0
            inconsistency = 0.0

        # High-contrast visual noise map
        noise_norm = cv2.normalize(residual, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
        noise_colored = cv2.applyColorMap(noise_norm, cv2.COLORMAP_INFERNO)
        noise_rgb = cv2.cvtColor(noise_colored, cv2.COLOR_BGR2RGB)

        metrics = {
            "noise_mean": round(var_mean, 2),
            "noise_std": round(var_std, 2),
            "noise_inconsistency": round(inconsistency, 3),
            "noise_score": round(inconsistency, 3),
        }
        return noise_rgb, metrics

    def analyze_frequency(self, image: Image.Image) -> Dict[str, float]:
        """
        2D Fast Fourier Transform (FFT) analysis.
        Detects periodic resampling grids, cloning patterns, and compression harmonics.
        """
        gray = cv2.cvtColor(np.array(image.convert("RGB")), cv2.COLOR_RGB2GRAY)

        target_size = 256
        gray_resized = cv2.resize(gray, (target_size, target_size), interpolation=cv2.INTER_AREA)

        f_transform = np.fft.fft2(gray_resized)
        f_shift = np.fft.fftshift(f_transform)
        magnitude_spectrum = 20 * np.log(np.abs(f_shift) + 1e-8)

        # High frequency energy ratio
        center = target_size // 2
        radius = target_size // 4
        y, x = np.ogrid[:target_size, :target_size]
        high_freq_mask = (x - center) ** 2 + (y - center) ** 2 > radius**2

        high_freq_energy = float(np.mean(magnitude_spectrum[high_freq_mask]))
        total_energy = float(np.mean(magnitude_spectrum))

        # Periodic spikes detection in high frequencies
        p99 = float(np.percentile(magnitude_spectrum[high_freq_mask], 99))
        p50 = float(np.median(magnitude_spectrum[high_freq_mask]))
        peak_ratio = float(np.clip((p99 - p50) / max(p50, 1.0), 0.0, 2.5) / 2.5)

        anomaly_score = float(np.clip((peak_ratio - 0.25) * 0.7 + (high_freq_energy / max(total_energy, 1.0)) * 0.3, 0.0, 1.0))

        return {
            "fft_high_freq_energy": round(high_freq_energy, 2),
            "fft_peak_ratio": round(peak_ratio, 3),
            "frequency_anomaly_score": round(anomaly_score, 3),
        }

    def analyze_exif(self, image: Image.Image) -> Dict[str, Any]:
        """
        Examine EXIF metadata tags and detect tampering software signatures.
        Clean images without EXIF are not penalized as forged.
        """
        exif_data: Dict[str, Any] = {}
        editing_software_detected = False
        camera_metadata_found = False
        software_name = None
        suspicious_flags = []

        try:
            info = image._getexif()
            if info:
                for tag, value in info.items():
                    tag_name = ExifTags.TAGS.get(tag, str(tag))
                    if isinstance(value, (bytes, bytearray)):
                        continue
                    exif_data[tag_name] = str(value)[:80]

                # Check for camera hardware signatures
                if any(k in exif_data for k in ["Make", "Model", "FNumber", "ExposureTime", "ISOSpeedRatings"]):
                    camera_metadata_found = True

                # Check for known photo editing and AI synthesis tools
                software = exif_data.get("Software", "").lower()
                processing = exif_data.get("ProcessingSoftware", "").lower()
                combined_sw = f"{software} {processing}"

                known_editors = [
                    "photoshop", "gimp", "lightroom", "canva", "midjourney",
                    "stable diffusion", "dall-e", "paint.net", "snapseed", "picsart",
                    "affinity photo", "pixelmator", "coreldraw"
                ]
                for ed in known_editors:
                    if ed in combined_sw:
                        editing_software_detected = True
                        software_name = ed.capitalize()
                        suspicious_flags.append(f"Edited with {software_name}")
                        break

                # Timestamp mismatch check
                date_original = exif_data.get("DateTimeOriginal")
                date_modified = exif_data.get("DateTime")
                if date_original and date_modified and date_original != date_modified:
                    suspicious_flags.append("Modification date differs from capture date")
        except Exception:
            pass

        # Calculate metadata risk score (0.0 to 1.0)
        risk_score = 0.0
        if editing_software_detected:
            risk_score += 0.80
        if len(suspicious_flags) > 1:
            risk_score += 0.20

        risk_score = min(round(risk_score, 3), 1.0)

        return {
            "camera_metadata_found": camera_metadata_found,
            "editing_software_detected": editing_software_detected,
            "software_name": software_name or exif_data.get("Software", "Unknown"),
            "suspicious_flags": suspicious_flags,
            "metadata_risk_score": risk_score,
            "tag_count": len(exif_data),
            "camera_model": exif_data.get("Model", "Unknown"),
            "camera_make": exif_data.get("Make", "Unknown"),
        }

    def localize_tamper_regions(
        self,
        image_shape: Tuple[int, int],
        cam_map: np.ndarray,
        ela_gray: np.ndarray,
        noise_gray: np.ndarray,
        threshold: float = 0.48,
        anomaly_score: float = 0.5,
    ) -> Tuple[np.ndarray, List[Dict[str, Any]], float]:
        """
        Fuse Grad-CAM Saliency, ELA Error Discrepancy, and Noise Anomaly to extract
        discrete tamper regions (bounding boxes and binary mask).
        Returns:
            tamper_mask: (H, W) uint8 binary mask (0 or 255)
            regions: list of bounding boxes with coordinates, area %, and confidence
            tamper_area_pct: percentage of image suspected tampered
        """
        orig_h, orig_w = image_shape[:2]
        total_pixels = orig_h * orig_w

        # If global anomaly score is authentic/clean (< 0.32), no tamper regions should be flagged
        if anomaly_score < 0.32:
            return np.zeros((orig_h, orig_w), dtype=np.uint8), [], 0.0

        # Resize all anomaly maps to original dimensions
        cam_resized = cv2.resize(cam_map.astype(np.float32), (orig_w, orig_h), interpolation=cv2.INTER_LINEAR)
        ela_norm = cv2.normalize(ela_gray.astype(np.float32), None, 0.0, 1.0, cv2.NORM_MINMAX)
        noise_norm = cv2.normalize(noise_gray.astype(np.float32), None, 0.0, 1.0, cv2.NORM_MINMAX)

        # Multi-modal anomaly composite: 45% CAM + 40% ELA + 15% Noise
        composite = 0.45 * cam_resized + 0.40 * ela_norm + 0.15 * noise_norm
        composite = np.clip(composite, 0.0, 1.0)

        # Dynamic thresholding based on distribution
        m_comp = float(np.mean(composite))
        s_comp = float(np.std(composite))
        adaptive_thresh = max(m_comp + 1.2 * s_comp, threshold)

        binary = (composite > adaptive_thresh).astype(np.uint8) * 255

        # Morphological clean up
        kernel_open = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
        kernel_close = cv2.getStructuringElement(cv2.MORPH_RECT, (11, 11))
        cleaned = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel_open)
        cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, kernel_close)

        # Find contours
        contours, _ = cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        regions: List[Dict[str, Any]] = []
        tampered_pixels = 0

        for i, c in enumerate(contours):
            area = cv2.contourArea(c)
            area_pct = round((area / total_pixels) * 100, 2)

            # Localized tamper region must be between 0.5% and 55% of image canvas
            # (ignoring full canvas ambient webs > 60% and tiny noise specs < 0.5%)
            if 0.5 <= area_pct <= 55.0:
                x, y, w, h = cv2.boundingRect(c)
                region_crop = composite[y : y + h, x : x + w]
                reg_conf = float(np.mean(region_crop)) if region_crop.size > 0 else 0.65
                reg_conf = float(np.clip(reg_conf * 1.25, 0.50, 0.99))

                if reg_conf >= 0.85:
                    severity = "Critical"
                elif reg_conf >= 0.70:
                    severity = "High"
                elif reg_conf >= 0.55:
                    severity = "Moderate"
                else:
                    severity = "Low"

                regions.append({
                    "id": len(regions) + 1,
                    "x": int(x),
                    "y": int(y),
                    "width": int(w),
                    "height": int(h),
                    "x_pct": round((x / orig_w) * 100, 1),
                    "y_pct": round((y / orig_h) * 100, 1),
                    "w_pct": round((w / orig_w) * 100, 1),
                    "h_pct": round((h / orig_h) * 100, 1),
                    "confidence": round(reg_conf, 3),
                    "area_pct": area_pct,
                    "severity": severity,
                })
                tampered_pixels += area

        # Sort regions descending by area
        regions.sort(key=lambda r: r["area_pct"], reverse=True)
        # Re-number IDs 1, 2, ...
        for idx, r in enumerate(regions):
            r["id"] = idx + 1

        tamper_area_pct = round((tampered_pixels / total_pixels) * 100, 2)
        return cleaned, regions, tamper_area_pct

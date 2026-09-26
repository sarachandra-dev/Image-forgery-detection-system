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


class ForensicAnalyzer:
    """Performs multi-disciplinary forensic examination on digital images."""

    def __init__(self, ela_quality: int = 90, ela_scale: int = 15):
        self.ela_quality = ela_quality
        self.ela_scale = ela_scale

    @staticmethod
    def compute_sha256(image_bytes: bytes) -> str:
        """Compute cryptographic SHA-256 hash of image data."""
        return hashlib.sha256(image_bytes).hexdigest()

    def analyze_ela(self, image: Image.Image) -> Tuple[np.ndarray, Dict[str, float]]:
        """
        Compute Error Level Analysis (ELA) and calculate statistical metrics.
        Returns:
            ela_rgb: (H, W, 3) uint8 image representing ELA error
            metrics: dict of statistical anomalies
        """
        rgb_img = image.convert("RGB")
        orig_arr = np.array(rgb_img, dtype=np.float32)

        buffer = io.BytesIO()
        rgb_img.save(buffer, format="JPEG", quality=self.ela_quality)
        buffer.seek(0)
        compressed = Image.open(buffer).convert("RGB")
        comp_arr = np.array(compressed, dtype=np.float32)

        # Difference scaled
        diff = np.abs(orig_arr - comp_arr)
        ela_scaled = np.clip(diff * self.ela_scale, 0, 255).astype(np.uint8)

        # Statistical properties
        diff_gray = np.mean(diff, axis=2)
        mean_err = float(np.mean(diff_gray))
        std_err = float(np.std(diff_gray))
        max_err = float(np.max(diff_gray))
        p95_err = float(np.percentile(diff_gray, 95))

        # Hotspot ratio: fraction of pixels with error > (mean + 2.0 * std)
        hotspot_threshold = mean_err + 2.0 * max(std_err, 1e-4)
        hotspots = diff_gray > hotspot_threshold
        hotspot_ratio = float(np.mean(hotspots))

        # Discrepancy metric (0.0 to 1.0)
        # Spliced images typically have high std relative to mean, or elevated p95
        discrepancy = float(np.clip((p95_err - mean_err) / max(mean_err, 1.0), 0.0, 3.0) / 3.0)
        score = float(np.clip((std_err / max(mean_err + 0.1, 1.0)) * 0.5 + hotspot_ratio * 3.0, 0.0, 1.0))

        metrics = {
            "mean_error": round(mean_err, 2),
            "std_error": round(std_err, 2),
            "max_error": round(max_err, 2),
            "p95_error": round(p95_err, 2),
            "hotspot_ratio": round(hotspot_ratio * 100, 2),
            "discrepancy_score": round(discrepancy, 3),
            "ela_score": round(score, 3),
        }
        return ela_scaled, metrics

    def analyze_noise(self, image: Image.Image) -> Tuple[np.ndarray, Dict[str, float]]:
        """
        Spatial Rich Model / Median Filter Residual analysis.
        Extracts high-frequency sensor noise and analyzes local variance consistency.
        Returns:
            noise_map_rgb: (H, W, 3) uint8 visualization of high-frequency noise
            metrics: noise variance metrics
        """
        rgb_arr = np.array(image.convert("RGB"))
        gray = cv2.cvtColor(rgb_arr, cv2.COLOR_RGB2GRAY)

        # 3x3 median filter residual: R = |I - median(I)|
        median = cv2.medianBlur(gray, 3)
        residual = cv2.absdiff(gray, median).astype(np.float32)

        # Local block noise variance analysis (16x16 blocks)
        h, w = gray.shape
        block_size = 16
        block_vars = []
        for y in range(0, h - block_size + 1, block_size):
            for x in range(0, w - block_size + 1, block_size):
                block = residual[y : y + block_size, x : x + block_size]
                block_vars.append(np.var(block))

        if len(block_vars) > 0:
            block_vars = np.array(block_vars)
            var_mean = float(np.mean(block_vars))
            var_std = float(np.std(block_vars))
            inconsistency = float(np.clip(var_std / max(var_mean, 1e-3), 0.0, 2.5) / 2.5)
        else:
            var_mean = 0.0
            var_std = 0.0
            inconsistency = 0.0

        # Create high-contrast visual noise map
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
        Detects periodic resampling, cloning grids, and AI generative synthesis artifacts.
        """
        gray = cv2.cvtColor(np.array(image.convert("RGB")), cv2.COLOR_RGB2GRAY)
        h, w = gray.shape

        # Resize to standard power of 2 for FFT stability if very large
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
        peak_ratio = float(np.clip((p99 - p50) / max(p50, 1.0), 0.0, 2.0) / 2.0)

        anomaly_score = float(np.clip(peak_ratio * 0.7 + (high_freq_energy / max(total_energy, 1.0)) * 0.3, 0.0, 1.0))

        return {
            "fft_high_freq_energy": round(high_freq_energy, 2),
            "fft_peak_ratio": round(peak_ratio, 3),
            "frequency_anomaly_score": round(anomaly_score, 3),
        }

    def analyze_exif(self, image: Image.Image) -> Dict[str, Any]:
        """
        Examine EXIF metadata tags and detect tampering software signatures.
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
                    "stable diffusion", "dall-e", "paint.net", "snapseed", "picsart"
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
                    suspicious_flags.append("Modification date differs from creation date")
        except Exception:
            pass

        # Calculate metadata risk score
        risk_score = 0.0
        if editing_software_detected:
            risk_score += 0.45
        if not camera_metadata_found:
            # Missing camera info is common in web downloads/screenshots, moderate risk flag
            risk_score += 0.20
        if len(suspicious_flags) > 1:
            risk_score += 0.15

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
        threshold: float = 0.55,
    ) -> Tuple[np.ndarray, List[Dict[str, Any]], float]:
        """
        Fuse Grad-CAM, ELA, and Noise Anomaly to extract discrete tamper regions (bounding boxes).
        Returns:
            tamper_mask: (H, W) uint8 binary mask (0 or 255)
            regions: list of bounding boxes with coordinates and confidence
            tamper_area_pct: percentage of image suspected tampered
        """
        orig_h, orig_w = image_shape[:2]

        # Resize all to original dimensions
        cam_resized = cv2.resize(cam_map.astype(np.float32), (orig_w, orig_h), interpolation=cv2.INTER_LINEAR)
        ela_norm = cv2.normalize(ela_gray.astype(np.float32), None, 0.0, 1.0, cv2.NORM_MINMAX)
        noise_norm = cv2.normalize(noise_gray.astype(np.float32), None, 0.0, 1.0, cv2.NORM_MINMAX)

        # Composite anomaly map: 45% CAM + 35% ELA + 20% Noise
        composite = 0.45 * cam_resized + 0.35 * ela_norm + 0.20 * noise_norm
        composite = np.clip(composite, 0.0, 1.0)

        # Thresholding to binary mask
        binary = (composite > threshold).astype(np.uint8) * 255

        # Morphological clean up
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
        binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
        binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)

        # Find contours
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        regions: List[Dict[str, Any]] = []
        total_pixels = orig_h * orig_w
        tampered_pixels = int(np.count_nonzero(binary))
        tamper_area_pct = round((tampered_pixels / total_pixels) * 100, 2)

        min_area = max(int(total_pixels * 0.005), 100)  # filter out tiny noise specs < 0.5% area

        for i, c in enumerate(contours):
            area = cv2.contourArea(c)
            if area < min_area:
                continue

            x, y, w, h = cv2.boundingRect(c)
            region_crop = composite[y : y + h, x : x + w]
            reg_conf = float(np.mean(region_crop)) if region_crop.size > 0 else 0.5
            area_pct = round((area / total_pixels) * 100, 2)

            if reg_conf >= 0.75:
                severity = "Critical"
            elif reg_conf >= 0.60:
                severity = "High"
            elif reg_conf >= 0.45:
                severity = "Moderate"
            else:
                severity = "Low"

            regions.append({
                "id": i + 1,
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

        # Sort regions descending by area
        regions.sort(key=lambda r: r["area_pct"], reverse=True)
        return binary, regions, tamper_area_pct

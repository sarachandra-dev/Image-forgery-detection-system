import pytest
import numpy as np
from PIL import Image
from ml.forensics.analyzer import ForensicAnalyzer


def test_forensic_analyzer_ela():
    analyzer = ForensicAnalyzer()
    img = Image.fromarray(np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8))
    ela_map, metrics = analyzer.analyze_ela(img)
    assert ela_map.shape == (100, 100, 3)
    assert "mean_error" in metrics
    assert "hotspot_ratio" in metrics
    assert 0.0 <= metrics["ela_score"] <= 1.0


def test_forensic_analyzer_noise():
    analyzer = ForensicAnalyzer()
    img = Image.fromarray(np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8))
    noise_map, metrics = analyzer.analyze_noise(img)
    assert noise_map.shape == (100, 100, 3)
    assert "noise_inconsistency" in metrics
    assert 0.0 <= metrics["noise_score"] <= 1.0


def test_forensic_analyzer_frequency():
    analyzer = ForensicAnalyzer()
    img = Image.fromarray(np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8))
    metrics = analyzer.analyze_frequency(img)
    assert "frequency_anomaly_score" in metrics
    assert 0.0 <= metrics["frequency_anomaly_score"] <= 1.0


def test_forensic_tamper_localization():
    analyzer = ForensicAnalyzer()
    cam = np.zeros((100, 100), dtype=np.float32)
    # create artificial hotspot in center
    cam[40:60, 40:60] = 0.95
    ela = np.zeros((100, 100), dtype=np.uint8)
    ela[40:60, 40:60] = 200
    noise = np.zeros((100, 100), dtype=np.uint8)
    noise[40:60, 40:60] = 180

    mask, regions, area_pct = analyzer.localize_tamper_regions((100, 100), cam, ela, noise, threshold=0.5)
    assert mask.shape == (100, 100)
    assert area_pct > 0.0
    assert len(regions) >= 1
    assert regions[0]["severity"] in ("Critical", "High", "Moderate", "Low")

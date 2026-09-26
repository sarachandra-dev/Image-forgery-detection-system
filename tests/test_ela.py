import pytest
import numpy as np
from PIL import Image
import io
from ml.preprocessing.ela import compute_ela, ela_from_pil


def make_test_image(path: str):
    img = Image.fromarray(np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8))
    img.save(path, format="JPEG")
    return img


def test_ela_from_pil_shape():
    img = Image.fromarray(np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8))
    ela = ela_from_pil(img)
    assert ela.shape == (100, 100, 3)
    assert ela.dtype == np.uint8


def test_ela_values_in_range():
    img = Image.fromarray(np.random.randint(0, 255, (64, 64, 3), dtype=np.uint8))
    ela = ela_from_pil(img)
    assert ela.min() >= 0
    assert ela.max() <= 255


def test_ela_scale_effect():
    img = Image.fromarray(np.random.randint(0, 255, (64, 64, 3), dtype=np.uint8))
    ela_low = ela_from_pil(img, scale=1)
    ela_high = ela_from_pil(img, scale=20)
    assert ela_high.mean() >= ela_low.mean()


def test_compute_ela_from_file(tmp_path):
    path = str(tmp_path / "test.jpg")
    make_test_image(path)
    ela = compute_ela(path)
    assert ela.shape[2] == 3
    assert ela.dtype == np.uint8

import numpy as np
from PIL import Image


def binarize_mask(mask: np.ndarray, threshold: float = 0.5) -> np.ndarray:
    return (mask >= threshold).astype(np.uint8)


def iou_score(pred_mask: np.ndarray, gt_mask: np.ndarray) -> float:
    pred = binarize_mask(pred_mask)
    gt = binarize_mask(gt_mask)
    intersection = (pred & gt).sum()
    union = (pred | gt).sum()
    return intersection / union if union > 0 else 0.0


def load_mask(path: str) -> np.ndarray:
    return np.array(Image.open(path).convert("L")) / 255.0

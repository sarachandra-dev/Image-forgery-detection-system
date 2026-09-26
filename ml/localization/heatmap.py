import numpy as np
import cv2
from PIL import Image


def cam_to_heatmap(
    cam: np.ndarray,
    original_image: Image.Image,
    alpha: float = 0.55,
    colormap: str = "JET",
) -> Image.Image:
    """
    Overlay GradCAM heatmap on original image at full resolution.
    Supports customizable colormap: JET, TURBO, INFERNO, VIRIDIS.
    """
    orig_rgb = np.array(original_image.convert("RGB"))
    orig_h, orig_w = orig_rgb.shape[:2]

    # Resize CAM to full image resolution smoothly
    cam_resized = cv2.resize(cam.astype(np.float32), (orig_w, orig_h), interpolation=cv2.INTER_CUBIC)
    cam_resized = np.clip(cam_resized, 0.0, 1.0)
    cam_uint8 = (cam_resized * 255).astype(np.uint8)

    cmap_code = {
        "JET": cv2.COLORMAP_JET,
        "TURBO": cv2.COLORMAP_TURBO if hasattr(cv2, "COLORMAP_TURBO") else cv2.COLORMAP_JET,
        "INFERNO": cv2.COLORMAP_INFERNO,
        "VIRIDIS": cv2.COLORMAP_VIRIDIS,
    }.get(colormap.upper(), cv2.COLORMAP_JET)

    heatmap = cv2.applyColorMap(cam_uint8, cmap_code)
    heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)

    overlay = (alpha * heatmap + (1.0 - alpha) * orig_rgb).astype(np.uint8)
    return Image.fromarray(overlay)


def save_heatmap(
    cam: np.ndarray,
    original_image: Image.Image,
    save_path: str,
    alpha: float = 0.55,
    colormap: str = "JET",
):
    result = cam_to_heatmap(cam, original_image, alpha=alpha, colormap=colormap)
    result.save(save_path, quality=95)

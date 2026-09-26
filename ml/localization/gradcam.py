import torch
import torch.nn.functional as F
import numpy as np
from typing import Optional


class GradCAM:
    """
    Gradient-weighted Class Activation Mapping (Grad-CAM).
    Produces visual explanation heatmaps highlighting discriminative image regions.
    Supports single-input (MobileNet) and multi-input (Dual-Stream Fusion) architectures.
    """

    def __init__(self, model: torch.nn.Module, target_layer: torch.nn.Module):
        self.model = model
        self.gradients: Optional[torch.Tensor] = None
        self.activations: Optional[torch.Tensor] = None

        target_layer.register_forward_hook(self._save_activation)
        target_layer.register_full_backward_hook(self._save_gradient)

    def _save_activation(self, _, __, output):
        self.activations = output.detach()

    def _save_gradient(self, _, __, grad_output):
        self.gradients = grad_output[0].detach()

    def generate(self, *inputs: torch.Tensor, class_idx: int = 1) -> np.ndarray:
        self.model.eval()
        output = self.model(*inputs)
        self.model.zero_grad()

        target_score = output[0, class_idx]
        target_score.backward(retain_graph=True)

        if self.gradients is None or self.activations is None:
            return np.zeros((224, 224), dtype=np.float32)

        weights = self.gradients.mean(dim=(2, 3), keepdim=True)
        cam = (weights * self.activations).sum(dim=1, keepdim=True)
        cam = F.relu(cam)
        cam = F.interpolate(cam, size=(224, 224), mode="bilinear", align_corners=False)
        cam_np = cam.squeeze().detach().cpu().numpy()

        cam_min = float(cam_np.min())
        cam_max = float(cam_np.max())
        if cam_max > cam_min:
            cam_np = (cam_np - cam_min) / (cam_max - cam_min)
        else:
            cam_np = np.zeros_like(cam_np)

        return cam_np

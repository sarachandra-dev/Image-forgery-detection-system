import torch
import torch.nn as nn
from torchvision import models


class MobileNetELAModel(nn.Module):
    """
    Lightweight MobileNetV3-Small architecture for Error Level Analysis (ELA)
    and on-device real-time digital image forgery classification.
    """

    def __init__(self, num_classes: int = 2, pretrained: bool = True):
        super().__init__()
        weights = models.MobileNet_V3_Small_Weights.DEFAULT if pretrained else None
        base = models.mobilenet_v3_small(weights=weights)
        self.features = base.features
        self.avgpool = base.avgpool
        in_features = base.classifier[0].in_features  # 576

        self.classifier = nn.Sequential(
            nn.Linear(in_features, 256),
            nn.Hardswish(),
            nn.Dropout(p=0.3),
            nn.Linear(256, num_classes),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        feat = self.features(x)
        pooled = self.avgpool(feat)
        flattened = torch.flatten(pooled, 1)
        return self.classifier(flattened)

    @property
    def target_cam_layer(self) -> nn.Module:
        """Returns the final convolutional block in features for Grad-CAM."""
        return self.features[-1]


def build_mobilenet(pretrained: bool = True, num_classes: int = 2) -> nn.Module:
    """Factory function for backward-compatible MobileNet instance."""
    return MobileNetELAModel(num_classes=num_classes, pretrained=pretrained)


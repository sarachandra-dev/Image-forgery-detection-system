import torch
import torch.nn as nn
from torchvision import models


class FusionModel(nn.Module):
    def __init__(self, num_classes: int = 2, pretrained: bool = True):
        super().__init__()
        weights = models.ResNet50_Weights.DEFAULT if pretrained else None

        # RGB stream
        rgb_base = models.resnet50(weights=weights)
        self.rgb_stream = nn.Sequential(*list(rgb_base.children())[:-1])
        rgb_feat = rgb_base.fc.in_features  # 2048

        # ELA stream (lighter backbone)
        ela_base = models.resnet34(
            weights=models.ResNet34_Weights.DEFAULT if pretrained else None
        )
        self.ela_stream = nn.Sequential(*list(ela_base.children())[:-1])
        ela_feat = ela_base.fc.in_features  # 512

        self.classifier = nn.Sequential(
            nn.Linear(rgb_feat + ela_feat, 512),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(512, num_classes),
        )

    def forward(self, rgb, ela):
        rgb_feat = self.rgb_stream(rgb).flatten(1)
        ela_feat = self.ela_stream(ela).flatten(1)
        fused = torch.cat([rgb_feat, ela_feat], dim=1)
        return self.classifier(fused)

    @property
    def target_cam_layer(self) -> nn.Module:
        """Returns target layer for Grad-CAM."""
        return list(self.rgb_stream[-2].children())[-1]


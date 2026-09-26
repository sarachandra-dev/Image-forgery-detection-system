import torch
import torch.nn as nn
from torchvision import models


class SegmentationModel(nn.Module):
    """Lightweight encoder-decoder for pixel-level forgery localization."""

    def __init__(self, pretrained: bool = True):
        super().__init__()
        base = models.resnet34(
            weights=models.ResNet34_Weights.DEFAULT if pretrained else None
        )
        self.enc1 = nn.Sequential(base.conv1, base.bn1, base.relu)   # 64
        self.pool = base.maxpool
        self.enc2 = base.layer1   # 64
        self.enc3 = base.layer2   # 128
        self.enc4 = base.layer3   # 256

        self.dec3 = self._up_block(256, 128)
        self.dec2 = self._up_block(128 + 128, 64)
        self.dec1 = self._up_block(64 + 64, 32)
        self.head = nn.Conv2d(32, 1, kernel_size=1)

    @staticmethod
    def _up_block(in_ch, out_ch):
        return nn.Sequential(
            nn.ConvTranspose2d(in_ch, out_ch, kernel_size=2, stride=2),
            nn.ReLU(),
            nn.Conv2d(out_ch, out_ch, 3, padding=1),
            nn.ReLU(),
        )

    def forward(self, x):
        e1 = self.enc1(x)
        e2 = self.enc2(self.pool(e1))
        e3 = self.enc3(e2)
        e4 = self.enc4(e3)

        d3 = self.dec3(e4)
        d2 = self.dec2(torch.cat([d3, e3], dim=1))
        d1 = self.dec1(torch.cat([d2, e2], dim=1))
        return torch.sigmoid(self.head(d1))

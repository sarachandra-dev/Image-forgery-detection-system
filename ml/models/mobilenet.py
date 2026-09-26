import torch.nn as nn
from torchvision import models


def build_mobilenet(pretrained: bool = True, num_classes: int = 2) -> nn.Module:
    model = models.mobilenet_v3_small(
        weights=models.MobileNet_V3_Small_Weights.DEFAULT if pretrained else None
    )
    model.classifier[-1] = nn.Linear(model.classifier[-1].in_features, num_classes)
    return model

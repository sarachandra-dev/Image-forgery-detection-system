import torch.nn as nn
from torchvision import models


def build_resnet_baseline(pretrained: bool = True, num_classes: int = 2) -> nn.Module:
    model = models.resnet50(weights=models.ResNet50_Weights.DEFAULT if pretrained else None)
    model.fc = nn.Linear(model.fc.in_features, num_classes)
    return model

import torch.nn as nn
from torchvision import models


def build_ela_model(pretrained: bool = True, num_classes: int = 2) -> nn.Module:
    model = models.resnet34(weights=models.ResNet34_Weights.DEFAULT if pretrained else None)
    model.fc = nn.Sequential(
        nn.Dropout(0.4),
        nn.Linear(model.fc.in_features, num_classes),
    )
    return model

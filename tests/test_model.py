import pytest
import torch
from ml.models.fusion_model import FusionModel
from ml.models.resnet_baseline import build_resnet_baseline
from ml.models.ela_model import build_ela_model


def test_fusion_model_output_shape():
    model = FusionModel(pretrained=False)
    model.eval()
    rgb = torch.randn(2, 3, 224, 224)
    ela = torch.randn(2, 3, 224, 224)
    with torch.no_grad():
        out = model(rgb, ela)
    assert out.shape == (2, 2)


def test_resnet_baseline_output_shape():
    model = build_resnet_baseline(pretrained=False)
    model.eval()
    x = torch.randn(2, 3, 224, 224)
    with torch.no_grad():
        out = model(x)
    assert out.shape == (2, 2)


def test_ela_model_output_shape():
    model = build_ela_model(pretrained=False)
    model.eval()
    x = torch.randn(2, 3, 224, 224)
    with torch.no_grad():
        out = model(x)
    assert out.shape == (2, 2)


def test_fusion_model_probabilities_sum_to_one():
    model = FusionModel(pretrained=False)
    model.eval()
    rgb = torch.randn(1, 3, 224, 224)
    ela = torch.randn(1, 3, 224, 224)
    with torch.no_grad():
        logits = model(rgb, ela)
        probs = torch.softmax(logits, dim=1)
    assert abs(probs.sum().item() - 1.0) < 1e-5

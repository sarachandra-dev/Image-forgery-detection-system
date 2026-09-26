import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torch.optim import AdamW
import os

from ml.models.resnet_baseline import build_resnet_baseline
from ml.preprocessing.dataset import ForgeryDataset
from ml.training.config import TrainConfig


def train(cfg: TrainConfig = TrainConfig()):
    device = torch.device(cfg.device if torch.cuda.is_available() else "cpu")

    train_ds = ForgeryDataset(f"{cfg.data_dir}/splits/train.csv", split="train")
    val_ds = ForgeryDataset(f"{cfg.data_dir}/splits/val.csv", split="val")

    train_loader = DataLoader(train_ds, batch_size=cfg.batch_size, shuffle=True, num_workers=cfg.num_workers)
    val_loader = DataLoader(val_ds, batch_size=cfg.batch_size, num_workers=cfg.num_workers)

    model = build_resnet_baseline().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = AdamW(model.parameters(), lr=cfg.lr, weight_decay=cfg.weight_decay)

    best_val_acc = 0.0

    for epoch in range(cfg.num_epochs):
        model.train()
        total_loss, correct = 0.0, 0

        for rgb, _, labels in train_loader:
            rgb, labels = rgb.to(device), labels.to(device)
            optimizer.zero_grad()
            out = model(rgb)
            loss = criterion(out, labels)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
            correct += (out.argmax(1) == labels).sum().item()

        model.eval()
        val_correct = 0
        with torch.no_grad():
            for rgb, _, labels in val_loader:
                rgb, labels = rgb.to(device), labels.to(device)
                val_correct += (model(rgb).argmax(1) == labels).sum().item()

        val_acc = val_correct / len(val_ds)
        print(f"Epoch {epoch+1} | Loss: {total_loss/len(train_loader):.4f} | Val Acc: {val_acc:.4f}")

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            os.makedirs(cfg.weights_dir, exist_ok=True)
            torch.save(model.state_dict(), f"{cfg.weights_dir}/rgb_baseline.pth")


if __name__ == "__main__":
    train()

import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR
import os

from ml.models.fusion_model import FusionModel
from ml.preprocessing.dataset import ForgeryDataset
from ml.training.config import TrainConfig


def train(cfg: TrainConfig = TrainConfig()):
    device = torch.device(cfg.device if torch.cuda.is_available() else "cpu")

    train_ds = ForgeryDataset(f"{cfg.data_dir}/splits/train.csv", split="train")
    val_ds = ForgeryDataset(f"{cfg.data_dir}/splits/val.csv", split="val")

    train_loader = DataLoader(train_ds, batch_size=cfg.batch_size, shuffle=True, num_workers=cfg.num_workers)
    val_loader = DataLoader(val_ds, batch_size=cfg.batch_size, num_workers=cfg.num_workers)

    model = FusionModel().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = AdamW(model.parameters(), lr=cfg.lr, weight_decay=cfg.weight_decay)
    scheduler = CosineAnnealingLR(optimizer, T_max=cfg.num_epochs)

    best_val_acc = 0.0
    patience_counter = 0

    for epoch in range(cfg.num_epochs):
        model.train()
        total_loss, correct = 0.0, 0

        for rgb, ela, labels in train_loader:
            rgb, ela, labels = rgb.to(device), ela.to(device), labels.to(device)
            optimizer.zero_grad()
            out = model(rgb, ela)
            loss = criterion(out, labels)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
            correct += (out.argmax(1) == labels).sum().item()

        train_acc = correct / len(train_ds)

        # Validation
        model.eval()
        val_correct = 0
        with torch.no_grad():
            for rgb, ela, labels in val_loader:
                rgb, ela, labels = rgb.to(device), ela.to(device), labels.to(device)
                out = model(rgb, ela)
                val_correct += (out.argmax(1) == labels).sum().item()

        val_acc = val_correct / len(val_ds)
        scheduler.step()

        print(f"Epoch {epoch+1}/{cfg.num_epochs} | Loss: {total_loss/len(train_loader):.4f} | Train Acc: {train_acc:.4f} | Val Acc: {val_acc:.4f}")

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            patience_counter = 0
            os.makedirs(cfg.weights_dir, exist_ok=True)
            torch.save(model.state_dict(), f"{cfg.weights_dir}/best_model.pth")
            print(f"  ✓ Saved best model (val_acc={val_acc:.4f})")
        else:
            patience_counter += 1
            if patience_counter >= cfg.early_stop_patience:
                print("Early stopping triggered.")
                break


if __name__ == "__main__":
    train()

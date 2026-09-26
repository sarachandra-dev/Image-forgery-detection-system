from dataclasses import dataclass


@dataclass
class TrainConfig:
    data_dir: str = "ml/data"
    weights_dir: str = "ml/weights"
    batch_size: int = 32
    num_epochs: int = 30
    lr: float = 1e-4
    weight_decay: float = 1e-4
    num_workers: int = 4
    device: str = "cuda"
    early_stop_patience: int = 5
    img_size: int = 224

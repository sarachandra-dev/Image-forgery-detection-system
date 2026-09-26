import pandas as pd
from PIL import Image
from torch.utils.data import Dataset
from .ela import ela_from_pil
from .image_preprocess import preprocess_rgb, preprocess_ela
from .augmentation import train_augment


class ForgeryDataset(Dataset):
    def __init__(self, csv_path: str, split: str = "train"):
        self.df = pd.read_csv(csv_path)
        self.split = split

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        image = Image.open(row["path"]).convert("RGB")
        label = int(row["label"])  # 0=authentic, 1=forged

        if self.split == "train":
            image = train_augment(image)

        ela_arr = ela_from_pil(image)
        rgb_tensor = preprocess_rgb(image)
        ela_tensor = preprocess_ela(ela_arr)

        return rgb_tensor, ela_tensor, label

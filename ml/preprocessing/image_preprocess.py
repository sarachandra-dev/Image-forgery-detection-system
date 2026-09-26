import numpy as np
from PIL import Image
import torchvision.transforms as T

IMG_SIZE = 224

rgb_transform = T.Compose([
    T.Resize((IMG_SIZE, IMG_SIZE)),
    T.ToTensor(),
    T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

ela_transform = T.Compose([
    T.Resize((IMG_SIZE, IMG_SIZE)),
    T.ToTensor(),
    T.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5]),
])


def preprocess_rgb(image: Image.Image):
    return rgb_transform(image.convert("RGB"))


def preprocess_ela(ela_array: np.ndarray):
    ela_image = Image.fromarray(ela_array)
    return ela_transform(ela_image)


def load_image(path: str) -> Image.Image:
    return Image.open(path).convert("RGB")

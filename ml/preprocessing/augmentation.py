import torchvision.transforms as T

train_augment = T.Compose([
    T.RandomHorizontalFlip(),
    T.RandomVerticalFlip(),
    T.RandomRotation(15),
    T.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
    T.RandomResizedCrop(224, scale=(0.8, 1.0)),
])

val_augment = T.Compose([
    T.Resize((224, 224)),
])

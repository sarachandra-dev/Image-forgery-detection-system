from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from pathlib import Path


class Settings(BaseSettings):
    app_name: str = "Image Forgery Detection API"
    version: str = "2.0.0"
    model_weights_path: str = "ml/weights/best_model.pth"
    device: str = "cpu"
    upload_dir: str = "backend/uploads"
    ela_output_dir: str = "backend/outputs/ela"
    heatmap_output_dir: str = "backend/outputs/heatmaps"
    noise_output_dir: str = "backend/outputs/noise"
    mask_output_dir: str = "backend/outputs/masks"
    samples_dir: str = "backend/static/samples"
    database_url: str = "sqlite+aiosqlite:///./backend/forgery.db"
    max_file_size_mb: int = 15
    allowed_extensions: list = ["jpg", "jpeg", "png", "bmp", "tiff", "webp"]

    model_config = ConfigDict(env_file=".env", extra="ignore")


settings = Settings()

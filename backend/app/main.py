from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from backend.app.core.config import settings
from backend.app.core.database import init_db
from backend.app.core.model_loader import load_model
from backend.app.api.routes import health, prediction, history, metrics, samples, stream


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure all directories exist
    for d in [
        settings.upload_dir,
        settings.ela_output_dir,
        settings.heatmap_output_dir,
        settings.noise_output_dir,
        settings.mask_output_dir,
        settings.samples_dir,
        "backend/static",
        "backend/outputs",
    ]:
        os.makedirs(d, exist_ok=True)

    await init_db()
    load_model()
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="Real-Time AI Multi-Modal Image Forgery Detection & Forensic Analysis API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static and output mounts
os.makedirs("backend/outputs", exist_ok=True)
os.makedirs("backend/static", exist_ok=True)
app.mount("/outputs", StaticFiles(directory="backend/outputs"), name="outputs")
app.mount("/static", StaticFiles(directory="backend/static"), name="static")

# Routes
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(prediction.router, prefix="/api", tags=["prediction"])
app.include_router(history.router, prefix="/api", tags=["history"])
app.include_router(metrics.router, prefix="/api", tags=["metrics"])
app.include_router(samples.router, prefix="/api", tags=["samples"])
app.include_router(stream.router, prefix="/api", tags=["realtime"])

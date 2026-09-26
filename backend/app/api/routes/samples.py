import os
from fastapi import APIRouter
from fastapi.responses import FileResponse
from backend.app.core.config import settings

router = APIRouter()

SAMPLES = [
    {
        "id": "authentic_sample",
        "title": "Authentic Photograph",
        "category": "authentic",
        "description": "Natural scene with uniform Poisson-Gaussian sensor noise and consistent JPEG compression.",
        "filename": "authentic_sample.jpg",
        "url": "/static/samples/authentic_sample.jpg",
    },
    {
        "id": "spliced_tamper",
        "title": "Spliced Object Insertion",
        "category": "forged",
        "description": "Foreign object spliced with mismatched Error Level Analysis (ELA) and noise variance discrepancy.",
        "filename": "spliced_tamper.jpg",
        "url": "/static/samples/spliced_tamper.jpg",
    },
    {
        "id": "copymove_tamper",
        "title": "Copy-Move Cloned Region",
        "category": "forged",
        "description": "Duplicate object cloned to another position with boundary discontinuity.",
        "filename": "copymove_tamper.jpg",
        "url": "/static/samples/copymove_tamper.jpg",
    },
    {
        "id": "software_edited",
        "title": "Software Retouched / Inpainted",
        "category": "forged",
        "description": "Region subjected to localized blur filtering, edge inpainting, and double compression artifacts.",
        "filename": "software_edited.jpg",
        "url": "/static/samples/software_edited.jpg",
    },
]


@router.get("/samples")
def get_samples():
    """List available forensic test samples."""
    return SAMPLES

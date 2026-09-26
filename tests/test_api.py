import pytest
import io
import numpy as np
from PIL import Image
from httpx import AsyncClient, ASGITransport
from backend.app.main import app


def make_jpeg_bytes() -> bytes:
    img = Image.fromarray(np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/health")
    assert resp.status_code == 200
    assert "status" in resp.json()


@pytest.mark.asyncio
async def test_predict_returns_result():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/api/predict",
            files={"file": ("test.jpg", make_jpeg_bytes(), "image/jpeg")},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["label"] in ("authentic", "forged")
    assert 0.0 <= data["confidence"] <= 1.0
    assert "regions" in data
    assert "metrics" in data


@pytest.mark.asyncio
async def test_predict_invalid_file_type():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/api/predict",
            files={"file": ("test.txt", b"not an image", "text/plain")},
        )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_history_returns_list():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/history")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_metrics():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/metrics")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert "uptime_seconds" in data
    assert "analytics" in data


@pytest.mark.asyncio
async def test_samples():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/samples")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 1

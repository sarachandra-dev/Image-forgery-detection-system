# Image Forgery Detection

AI-powered image forgery detection using ELA + dual-stream CNN (ResNet50 + ResNet34) with GradCAM localization.

## Architecture

- **ML**: RGB + ELA fusion model → GradCAM heatmap
- **Backend**: FastAPI + SQLite (async)
- **Frontend**: React + Vite + Tailwind CSS

---

## Quick Start

### 1. Backend

```bash
# Install dependencies
pip install -r requirements.txt
pip install -r backend/requirements.txt

# Run server (demo mode if no weights found)
uvicorn backend.app.main:app --reload
```

API available at `http://localhost:8000`  
Swagger docs at `http://localhost:8000/docs`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App available at `http://localhost:5173`

### 3. Docker (full stack)

```bash
docker-compose up --build
```

---

## Training

### Prepare data
Place images in `ml/data/raw/authentic/` and `ml/data/raw/forged/`  
Create CSVs in `ml/data/splits/` with columns: `path`, `label` (0=authentic, 1=forged)

### Train fusion model
```bash
python -m ml.training.train_fusion
```

Weights saved to `ml/weights/best_model.pth`

---

## Testing

```bash
pip install pytest pytest-asyncio httpx
pytest tests/ -v
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check + model status |
| POST | `/api/predict` | Upload image → get prediction |
| GET | `/api/history` | List past predictions |
| DELETE | `/api/history/{id}` | Delete a record |

---

## Model Pipeline

1. **ELA** — Re-compress image, compute pixel difference map
2. **RGB stream** — ResNet50 extracts spatial features
3. **ELA stream** — ResNet34 extracts compression artifact features  
4. **Fusion** — Concatenate features → classify (authentic/forged)
5. **GradCAM** — Highlight tampered regions on original image

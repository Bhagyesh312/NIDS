# NIDS Backend — FastAPI + PostgreSQL

## Requirements
- Python 3.10+
- PostgreSQL running locally with database `NIDS` created
- Trained model at `models/model.pkl` (run `03_model_training.ipynb` first)

## Setup

```bash
cd D:\NIDS\backend
pip install fastapi uvicorn sqlalchemy psycopg2-binary python-multipart pandas joblib
```

## Run

```bash
cd D:\NIDS\backend
uvicorn main:app --reload
```

Server starts at: http://localhost:8000
API docs at:      http://localhost:8000/docs

## Endpoints

| Method | Endpoint          | Description                        |
|--------|-------------------|------------------------------------|
| GET    | /                 | Health check + model status        |
| GET    | /health           | Simple health check                |
| POST   | /predict          | Single flow prediction             |
| POST   | /predict/batch    | CSV batch prediction               |
| GET    | /alerts           | Get stored attack alerts from DB   |
| GET    | /alerts/count     | Unread alert count (sidebar badge) |
| GET    | /stats            | Dashboard statistics               |
| GET    | /model-info       | Model details + confusion matrix   |
| GET    | /globe-stats      | Attack origins for globe page      |
| GET    | /reports/summary  | Reports page data                  |

## Database

Tables are auto-created on startup via SQLAlchemy.
All predictions (single + batch) are saved to the `predictions` table.

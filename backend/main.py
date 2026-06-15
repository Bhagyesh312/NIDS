from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from database import engine, Base
import models   # registers all tables
import ml
from routes import predict, alerts, stats, reports

# ── Create all DB tables on startup ──────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created / verified")
    ml.load_artifacts()
    yield

# ── App ───────────────────────────────────────────────────────
app = FastAPI(
    title       = "NIDS — Network Intrusion Detection API",
    description = "FastAPI backend for the NIDS dashboard. Serves predictions and stats.",
    version     = "1.0.0",
    lifespan    = lifespan,
)

# ── CORS — allow React frontend on localhost:5173 ─────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

# ── Routes ────────────────────────────────────────────────────
app.include_router(predict.router)
app.include_router(alerts.router)
app.include_router(stats.router)
app.include_router(reports.router)

@app.get("/")
def root():
    return {
        "message": "NIDS API running",
        "model_ready": ml.is_ready(),
        "docs": "/docs",
    }

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": ml.is_ready()}

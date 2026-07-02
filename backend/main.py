from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
from sqlalchemy import text

from database import engine, Base
import ml
from routes import predict, alerts, stats, reports, simulate

# ── Startup / shutdown ────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all DB tables if they don't exist
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables ready")

    # Add model_used column if it doesn't exist (migration for existing DBs — PostgreSQL only)
    if engine.dialect.name == 'postgresql':
        with engine.connect() as conn:
            try:
                conn.execute(text(
                    "ALTER TABLE predictions ADD COLUMN IF NOT EXISTS model_used VARCHAR(10) DEFAULT 'kdd'"
                ))
                conn.commit()
                print("✓ model_used column ensured")
            except Exception as e:
                print(f"  model_used column note: {e}")

    # Load ML model + preprocessors
    ml.load_artifacts()
    yield

# ── App ───────────────────────────────────────────────────────
app = FastAPI(
    title       = "NIDS — Network Intrusion Detection API",
    description = "FastAPI backend powering the NIDS dashboard. ML predictions + PostgreSQL storage.",
    version     = "1.0.0",
    lifespan    = lifespan,
)

# ── CORS — allow React frontend ───────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins     = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

# ── Clean validation error responses ─────────────────────────
@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError):
    errors = []
    for e in exc.errors():
        field = " → ".join(str(x) for x in e["loc"] if x != "body")
        errors.append({"field": field, "message": e["msg"]})
    return JSONResponse(
        status_code = 422,
        content     = {"detail": "Validation error", "errors": errors},
    )

# ── Routes ────────────────────────────────────────────────────
app.include_router(predict.router)
app.include_router(alerts.router)
app.include_router(stats.router)
app.include_router(reports.router)
app.include_router(simulate.router)

# ── Root endpoints ────────────────────────────────────────────
@app.get("/", tags=["health"])
def root():
    return {
        "message":     "NIDS API is running",
        "model_ready": ml.is_ready(),
        "docs":        "/docs",
        "version":     "1.0.0",
    }

@app.get("/health", tags=["health"])
def health():
    return {
        "status":       "ok",
        "model_loaded": ml.is_ready(),
        "db":           "connected",
    }

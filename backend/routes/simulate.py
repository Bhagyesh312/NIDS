"""
Live simulation endpoint.

POST /simulate/start  — starts a background thread that loads rows from the
                        processed test set and runs predictions every N seconds,
                        saving results to the DB exactly like real predictions.
POST /simulate/stop   — stops the running simulation.
GET  /simulate/status — returns whether simulation is running + stats.
"""

import threading
import random
import numpy as np
import os
import json

from fastapi import APIRouter, Query, HTTPException
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Prediction
import ml

router = APIRouter(prefix="/simulate", tags=["simulate"])

# ── Simulation state ──────────────────────────────────────────
_state_lock = threading.Lock()   # protect counter increments
_state = {
    "running":       False,
    "thread":        None,
    "total_sent":    0,
    "attacks_found": 0,
    "model":         "kdd",
}
_stop_event = threading.Event()

# ── Test data cache ───────────────────────────────────────────
BASE_DIR      = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROCESSED_DIR = os.path.join(BASE_DIR, 'data', 'processed')
_CICIDS_PROCESSED_DIR = os.path.join(PROCESSED_DIR, 'cicids')

_test_data_cache: dict = {}   # model -> (X_test, y_test, feature_names, classes)


def _load_test_data(model: str):
    """Load or return cached test set for the given model."""
    if model in _test_data_cache:
        return _test_data_cache[model]

    try:
        if model == 'kdd':
            X = np.load(os.path.join(PROCESSED_DIR, 'X_test.npy'))
        else:
            X = np.load(os.path.join(_CICIDS_PROCESSED_DIR, 'X_test.npy'))

        feature_names = ml.get_feature_names(model)

        _test_data_cache[model] = (X, feature_names)
        return _test_data_cache[model]
    except Exception as e:
        print(f"[simulate] Could not load test data for {model}: {e}")
        return None


def _run_simulation(model: str, interval: float, batch_size: int):
    """Worker thread: repeatedly sample rows from the test set and predict."""
    data = _load_test_data(model)
    if data is None:
        _state["running"] = False
        return

    X, feature_names = data
    num_rows = X.shape[0]

    clf            = ml._get(model, 'model')
    target_encoder = ml._get(model, 'target_encoder')

    if clf is None:
        _state["running"] = False
        return

    normal_label = 'Benign' if model == 'cicids' else 'Normal'

    while not _stop_event.is_set():
        db: Session = SessionLocal()
        try:
            # Pick random rows
            idxs = random.sample(range(num_rows), min(batch_size, num_rows))
            X_sample = X[idxs]

            # Predict directly on pre-scaled data (already scaled in the .npy)
            proba    = clf.predict_proba(X_sample)
            pred_idx = np.argmax(proba, axis=1)
            confs    = proba[np.arange(len(pred_idx)), pred_idx]
            labels   = [target_encoder.classes_[i] for i in pred_idx]

            records = []
            for label, conf, row_X in zip(labels, confs, X_sample):
                # Build a feature dict for storage (first 5 features)
                feat_dict = {feature_names[i]: float(row_X[i])
                             for i in range(min(5, len(feature_names)))}
                records.append(Prediction(
                    prediction   = label,
                    confidence   = round(float(conf), 4),
                    source       = 'simulate',
                    model_used   = model,
                    raw_features = json.dumps(feat_dict),
                ))

            attack_count = sum(1 for label in labels if label != normal_label)
            db.add_all(records)
            db.commit()
            with _state_lock:
                _state["total_sent"]    += len(records)
                _state["attacks_found"] += attack_count

        except Exception as e:
            print(f"[simulate] Error in simulation loop: {e}")
        finally:
            db.close()

        _stop_event.wait(timeout=interval)

    _state["running"] = False
    print("[simulate] Simulation stopped.")


# ── Routes ────────────────────────────────────────────────────

@router.post("/start")
def start_simulation(
    model:      str   = Query('kdd',  description="Model to use: 'kdd' or 'cicids'"),
    interval:   float = Query(5.0,    description="Seconds between prediction batches (1–60)", ge=1.0, le=60.0),
    batch_size: int   = Query(5,      description="Rows per batch (1–50)", ge=1, le=50),
):
    """
    Start live simulation — samples rows from the test set, runs predictions,
    and saves results to the DB so all pages update in real-time.
    """
    if model not in ('kdd', 'cicids'):
        raise HTTPException(status_code=400, detail="model must be 'kdd' or 'cicids'")

    if not ml.is_ready(model):
        raise HTTPException(
            status_code=503,
            detail={"error": f"Model '{model}' not loaded",
                    "hint": "Run the training notebook first."}
        )

    if _state["running"]:
        # Already running — just return current status
        return {"status": "already_running", **_status_dict()}

    # Reset
    _stop_event.clear()
    _state.update({"running": True, "total_sent": 0,
                   "attacks_found": 0, "model": model})

    t = threading.Thread(
        target=_run_simulation,
        args=(model, interval, batch_size),
        daemon=True,
    )
    _state["thread"] = t
    t.start()

    return {"status": "started", **_status_dict()}


@router.post("/stop")
def stop_simulation():
    """Stop the running simulation."""
    if not _state["running"]:
        return {"status": "not_running", **_status_dict()}

    _stop_event.set()
    # Give thread a moment to finish
    if _state["thread"] and _state["thread"].is_alive():
        _state["thread"].join(timeout=3.0)

    _state["running"] = False
    return {"status": "stopped", **_status_dict()}


@router.get("/status")
def get_status():
    """Returns current simulation state."""
    return _status_dict()


def _status_dict():
    return {
        "running":       _state["running"],
        "model":         _state["model"],
        "total_sent":    _state["total_sent"],
        "attacks_found": _state["attacks_found"],
    }

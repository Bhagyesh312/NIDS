import json
import uuid
from collections import Counter

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, Request
from sqlalchemy.orm import Session
import io

from database import get_db
from models import Prediction
from schemas import PredictRequest, CICIDSPredictRequest, PredictResponse
import ml

router = APIRouter(prefix="/predict", tags=["predict"])

VALID_MODELS = {'kdd', 'cicids'}


def _check_model(model: str):
    """Validate model param and raise 400 / 503 as needed."""
    if model not in VALID_MODELS:
        raise HTTPException(status_code=400, detail=f"model must be one of {VALID_MODELS}")
    if not ml.is_ready(model):
        avail = ml.get_available_models()
        raise HTTPException(
            status_code=503,
            detail={
                "error": f"Model '{model}' not loaded",
                "available": avail,
                "hint": "Run the relevant training notebook to generate the model .pkl file.",
            }
        )


@router.post("", response_model=PredictResponse)
async def predict_single(
    request: Request,
    model: str     = Query('kdd', description="Model to use: 'kdd' or 'cicids'"),
    db:    Session = Depends(get_db),
):
    """
    Classify a single network flow.
    Use ?model=kdd (NSL-KDD, 40 features) or ?model=cicids (CICIDS2017, 69 features).
    Saves the result to the predictions table.
    """
    _check_model(model)

    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Request body must be valid JSON.")

    if model == 'cicids':
        req = CICIDSPredictRequest(**body)
        features = req.to_feature_dict()
        src_ip   = req.src_ip
        dst_ip   = req.dst_ip
        protocol = None
        service  = None
    else:
        req = PredictRequest(**body)
        features = req.model_dump(exclude={'src_ip', 'dst_ip'})
        src_ip   = req.src_ip
        dst_ip   = req.dst_ip
        protocol = req.protocol_type
        service  = req.service

    label, confidence, top_features = ml.predict_single(features, model)

    if label is None:
        raise HTTPException(status_code=500, detail="Prediction failed — check server logs.")

    # Persist to DB
    record = Prediction(
        src_ip       = src_ip,
        dst_ip       = dst_ip,
        protocol     = protocol,
        service      = service,
        prediction   = label,
        confidence   = round(confidence, 4),
        source       = 'single',
        model_used   = model,
        raw_features = json.dumps(features),
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return PredictResponse(
        prediction    = label,
        confidence    = round(confidence, 4),
        top_features  = top_features,
        prediction_id = record.id,
    )


@router.post("/batch")
def predict_batch(
    file:  UploadFile = File(...),
    model: str        = Query('kdd', description="Model to use: 'kdd' or 'cicids'"),
    db:    Session    = Depends(get_db),
):
    """
    Classify multiple flows from an uploaded CSV file.
    All results are saved to the predictions table under a shared batch_id.
    Use ?model=cicids for the CICIDS2017 model.
    """
    _check_model(model)

    if not file.filename.lower().endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a .csv")

    content = file.file.read()
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {str(e)}")

    if df.empty:
        raise HTTPException(status_code=400, detail="CSV file is empty.")

    if len(df) > 10000:
        raise HTTPException(status_code=400, detail="CSV too large — max 10,000 rows.")

    batch_id    = str(uuid.uuid4())[:8].upper()
    predictions = ml.predict_batch(df, model)

    # Save all predictions in one bulk insert
    records = [
        Prediction(
            prediction = p['prediction'],
            confidence = round(p['confidence'], 4),
            source     = 'batch',
            batch_id   = batch_id,
            model_used = model,
        )
        for p in predictions
    ]
    db.add_all(records)
    db.commit()

    # Count per category
    counts = Counter(p['prediction'] for p in predictions)
    # Determine "normal" label based on model
    normal_label = 'Benign' if model == 'cicids' else 'Normal'

    return {
        "batch_id":   batch_id,
        "model_used": model,
        "total":      len(predictions),
        "attacks":    sum(v for k, v in counts.items() if k != normal_label),
        "breakdown":  dict(counts),
        "results":    predictions,
    }


@router.get("/models")
def get_models():
    """Returns which models are loaded and ready."""
    return {
        "available": ml.get_available_models(),
        "models": {
            "kdd": {
                "name":     "NSL-KDD",
                "classes":  ml.get_target_classes('kdd'),
                "features": len(ml.get_feature_names('kdd')),
                "ready":    ml.is_ready('kdd'),
            },
            "cicids": {
                "name":     "CICIDS2017",
                "classes":  ml.get_target_classes('cicids'),
                "features": len(ml.get_feature_names('cicids')),
                "ready":    ml.is_ready('cicids'),
            },
        }
    }

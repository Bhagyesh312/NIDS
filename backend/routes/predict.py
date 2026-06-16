import json
import uuid
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import io

from database import get_db
from models import Prediction
from schemas import PredictRequest, PredictResponse
import ml

router = APIRouter(prefix="/predict", tags=["predict"])


@router.post("", response_model=PredictResponse)
def predict_single(req: PredictRequest, db: Session = Depends(get_db)):
    """
    Classify a single network flow.
    Saves the result to the predictions table.
    Returns prediction label, confidence score, and top contributing features.
    """
    if not ml.is_ready():
        raise HTTPException(
            status_code=503,
            detail={
                "error": "Model not loaded",
                "hint": "Ask your teammate to run notebooks/03_model_training.ipynb to generate models/model.pkl"
            }
        )

    features = req.model_dump(exclude={'src_ip', 'dst_ip'})
    label, confidence, top_features = ml.predict_single(features)

    if label is None:
        raise HTTPException(status_code=500, detail="Prediction failed — check server logs.")

    # Persist to DB
    record = Prediction(
        src_ip       = req.src_ip,
        dst_ip       = req.dst_ip,
        protocol     = req.protocol_type,
        service      = req.service,
        prediction   = label,
        confidence   = round(confidence, 4),
        source       = 'single',
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
    file: UploadFile = File(...),
    db:   Session    = Depends(get_db),
):
    """
    Classify multiple flows from an uploaded CSV file.
    All results are saved to the predictions table under a shared batch_id.
    """
    if not ml.is_ready():
        raise HTTPException(
            status_code=503,
            detail={
                "error": "Model not loaded",
                "hint": "Run notebooks/03_model_training.ipynb first"
            }
        )

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
    predictions = ml.predict_batch(df)

    # Save all predictions in one bulk insert
    records = [
        Prediction(
            prediction = p['prediction'],
            confidence = round(p['confidence'], 4),
            source     = 'batch',
            batch_id   = batch_id,
        )
        for p in predictions
    ]
    db.add_all(records)
    db.commit()

    # Count per category
    from collections import Counter
    counts = Counter(p['prediction'] for p in predictions)

    return {
        "batch_id":   batch_id,
        "total":      len(predictions),
        "attacks":    sum(v for k, v in counts.items() if k != 'Normal'),
        "breakdown":  dict(counts),
        "results":    predictions,
    }

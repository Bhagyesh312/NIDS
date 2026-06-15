import json
import uuid
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import io

from database import get_db
from models import Prediction
from schemas import PredictRequest, PredictResponse
import ml

router = APIRouter(prefix="/predict", tags=["predict"])

@router.post("", response_model=PredictResponse)
def predict_single(req: PredictRequest, db: Session = Depends(get_db)):
    if not ml.is_ready():
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Run notebooks/03_model_training.ipynb first."
        )

    features = req.model_dump(exclude={'src_ip', 'dst_ip'})
    label, confidence, top_features = ml.predict_single(features)

    if label is None:
        raise HTTPException(status_code=500, detail="Prediction failed.")

    # Save to DB
    record = Prediction(
        src_ip       = req.src_ip,
        dst_ip       = req.dst_ip,
        protocol     = req.protocol_type,
        service      = req.service,
        prediction   = label,
        confidence   = confidence,
        source       = 'single',
        raw_features = json.dumps(features),
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return PredictResponse(
        prediction    = label,
        confidence    = confidence,
        top_features  = top_features,
        prediction_id = record.id,
    )


@router.post("/batch")
def predict_batch(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not ml.is_ready():
        raise HTTPException(status_code=503, detail="Model not loaded.")

    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV.")

    content = file.file.read()
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception:
        raise HTTPException(status_code=400, detail="Could not parse CSV.")

    batch_id = str(uuid.uuid4())[:8]
    predictions = ml.predict_batch(df)

    # Save all to DB
    records = [
        Prediction(
            prediction = p['prediction'],
            confidence = p['confidence'],
            source     = 'batch',
            batch_id   = batch_id,
        )
        for p in predictions
    ]
    db.add_all(records)
    db.commit()

    return {
        "batch_id": batch_id,
        "total":    len(predictions),
        "results":  predictions,
    }

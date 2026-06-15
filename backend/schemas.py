from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# ── Predict request ───────────────────────────────────────────
class PredictRequest(BaseModel):
    duration:            float = 0
    protocol_type:       str   = 'tcp'
    service:             str   = 'http'
    flag:                str   = 'SF'
    src_bytes:           float = 0
    dst_bytes:           float = 0
    land:                float = 0
    wrong_fragment:      float = 0
    urgent:              float = 0
    hot:                 float = 0
    num_failed_logins:   float = 0
    logged_in:           float = 0
    count:               float = 1
    srv_count:           float = 1
    serror_rate:         float = 0
    rerror_rate:         float = 0
    same_srv_rate:       float = 1
    diff_srv_rate:       float = 0
    # Optional metadata
    src_ip:              Optional[str] = None
    dst_ip:              Optional[str] = None

# ── Predict response ──────────────────────────────────────────
class PredictResponse(BaseModel):
    prediction:   str
    confidence:   float
    top_features: Optional[List[List]] = None
    prediction_id: int

# ── Alert (stored prediction) ─────────────────────────────────
class AlertOut(BaseModel):
    id:         int
    src_ip:     Optional[str]
    dst_ip:     Optional[str]
    protocol:   Optional[str]
    service:    Optional[str]
    prediction: str
    confidence: float
    source:     str
    created_at: datetime

    class Config:
        from_attributes = True

# ── Stats response ────────────────────────────────────────────
class StatsResponse(BaseModel):
    total:        int
    attacks:      int
    normal:       int
    accuracy:     str
    distribution: list

# ── Model info response ───────────────────────────────────────
class ModelInfoResponse(BaseModel):
    algorithm:          str
    dataset:            str
    samples:            int
    features:           int
    train_size:         str
    confusion_matrix:   dict
    feature_importance: list

from pydantic import BaseModel, field_validator
from typing import Optional, List, ClassVar, Set
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
    src_ip:              Optional[str] = None
    dst_ip:              Optional[str] = None

    VALID_PROTOCOLS: ClassVar[Set[str]] = {'tcp', 'udp', 'icmp'}
    VALID_FLAGS:     ClassVar[Set[str]] = {'SF', 'S0', 'REJ', 'RSTO', 'SH', 'RSTR',
                                           'S1', 'S2', 'S3', 'OTH', 'RSTOS0'}

    @field_validator('protocol_type')
    @classmethod
    def validate_protocol(cls, v):
        v = v.lower().strip()
        if v not in cls.VALID_PROTOCOLS:
            raise ValueError(f"protocol_type must be one of {cls.VALID_PROTOCOLS}")
        return v

    @field_validator('flag')
    @classmethod
    def validate_flag(cls, v):
        v = v.upper().strip()
        if v not in cls.VALID_FLAGS:
            raise ValueError(f"flag must be one of {cls.VALID_FLAGS}")
        return v

    @field_validator('serror_rate', 'rerror_rate', 'same_srv_rate', 'diff_srv_rate')
    @classmethod
    def validate_rate(cls, v):
        if not (0.0 <= v <= 1.0):
            raise ValueError("Rate values must be between 0.0 and 1.0")
        return v

    @field_validator('duration', 'src_bytes', 'dst_bytes', 'count', 'srv_count')
    @classmethod
    def validate_non_negative(cls, v):
        if v < 0:
            raise ValueError("Value must be non-negative")
        return v


# ── Predict response ──────────────────────────────────────────
class PredictResponse(BaseModel):
    prediction:    str
    confidence:    float
    top_features:  Optional[List[List]] = None
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

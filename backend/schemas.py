from pydantic import BaseModel, field_validator, model_validator
from typing import Optional, List, ClassVar, Set, Any
from datetime import datetime


# ── KDD Predict request ───────────────────────────────────────
# Used for NSL-KDD single-flow predictions (40 KDD features).
class PredictRequest(BaseModel):
    # Core KDD features (subset shown in the UI form)
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
    num_compromised:     float = 0
    root_shell:          float = 0
    su_attempted:        float = 0
    num_root:            float = 0
    num_file_creations:  float = 0
    num_shells:          float = 0
    num_access_files:    float = 0
    is_host_login:       float = 0
    is_guest_login:      float = 0
    count:               float = 1
    srv_count:           float = 1
    serror_rate:         float = 0
    srv_serror_rate:     float = 0
    rerror_rate:         float = 0
    srv_rerror_rate:     float = 0
    same_srv_rate:       float = 1
    diff_srv_rate:       float = 0
    srv_diff_host_rate:  float = 0
    dst_host_count:               float = 0
    dst_host_srv_count:           float = 0
    dst_host_same_srv_rate:       float = 0
    dst_host_diff_srv_rate:       float = 0
    dst_host_same_src_port_rate:  float = 0
    dst_host_srv_diff_host_rate:  float = 0
    dst_host_serror_rate:         float = 0
    dst_host_srv_serror_rate:     float = 0
    dst_host_rerror_rate:         float = 0
    dst_host_srv_rerror_rate:     float = 0

    # Optional metadata (not used as model features)
    src_ip:  Optional[str] = None
    dst_ip:  Optional[str] = None

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


# ── CICIDS Predict request ────────────────────────────────────
# CICIDS2017 has 69 numeric features with free-form names.
# We accept any key→float mapping so the frontend can send all fields.
class CICIDSPredictRequest(BaseModel):
    model_config = {"extra": "allow"}   # accept all 69 feature fields

    src_ip: Optional[str] = None
    dst_ip: Optional[str] = None

    @model_validator(mode='before')
    @classmethod
    def coerce_numeric(cls, values: Any) -> Any:
        """Coerce all non-metadata fields to float; skip nulls and metadata keys."""
        skip = {'src_ip', 'dst_ip'}
        if not isinstance(values, dict):
            return values
        coerced = {}
        for k, v in values.items():
            if k in skip or v is None:
                coerced[k] = v
            else:
                try:
                    coerced[k] = float(v)
                except (TypeError, ValueError):
                    coerced[k] = 0.0  # treat unparseable values as 0
        return coerced

    def to_feature_dict(self) -> dict:
        """Return all fields except src_ip / dst_ip as a float dict."""
        skip = {'src_ip', 'dst_ip'}
        data = self.model_dump()
        # Values are already float from coerce_numeric; filter metadata only
        return {k: v for k, v in data.items() if k not in skip and v is not None}


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
    model_used: Optional[str] = 'kdd'
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
    test_accuracy:      Optional[float]  = None
    test_f1_weighted:   Optional[float]  = None
    val_accuracy:       Optional[float]  = None
    confusion_matrix:   dict
    feature_importance: list
    classes:            Optional[List[str]]  = None
    mlflow_run_id:      Optional[str]        = None
    hyperparameters:    Optional[dict]       = None

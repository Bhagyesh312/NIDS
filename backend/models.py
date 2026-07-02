from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Index
from sqlalchemy.sql import func
from database import Base

class Prediction(Base):
    """
    Stores every prediction made — single flow or batch.
    This powers the Alerts page, Reports page, and Globe page with real data.
    """
    __tablename__ = "predictions"

    id             = Column(Integer, primary_key=True, index=True)
    src_ip         = Column(String(50),  nullable=True)   # source IP (if provided)
    dst_ip         = Column(String(50),  nullable=True)   # destination IP (if provided)
    protocol       = Column(String(10),  nullable=True)   # tcp / udp / icmp
    service        = Column(String(30),  nullable=True)   # http / ftp / ssh etc
    prediction     = Column(String(50),  nullable=False)  # Normal / DoS / Probe / R2L / U2R / Benign / ...
    confidence     = Column(Float,       nullable=False)  # 0.0 - 1.0
    subtype        = Column(String(50),  nullable=True)   # neptune / portsweep etc (if known)
    source         = Column(String(20),  default='single') # 'single' or 'batch'
    batch_id       = Column(String(50),  nullable=True)   # groups batch predictions together
    model_used     = Column(String(10),  default='kdd')   # 'kdd' or 'cicids'
    raw_features   = Column(Text,        nullable=True)   # JSON of input features
    created_at     = Column(DateTime(timezone=True), server_default=func.now())

    # Composite indexes for the most common query patterns
    __table_args__ = (
        Index('ix_pred_model_created',    'model_used', 'created_at'),
        Index('ix_pred_model_prediction', 'model_used', 'prediction'),
        Index('ix_pred_model_src_ip',     'model_used', 'src_ip'),
    )

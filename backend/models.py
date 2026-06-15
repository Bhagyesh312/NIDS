from sqlalchemy import Column, Integer, String, Float, DateTime, Text
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
    prediction     = Column(String(20),  nullable=False)  # Normal / DoS / Probe / R2L / U2R
    confidence     = Column(Float,       nullable=False)  # 0.0 - 1.0
    subtype        = Column(String(50),  nullable=True)   # neptune / portsweep etc (if known)
    source         = Column(String(20),  default='single') # 'single' or 'batch'
    batch_id       = Column(String(50),  nullable=True)   # groups batch predictions together
    raw_features   = Column(Text,        nullable=True)   # JSON of input features
    created_at     = Column(DateTime(timezone=True), server_default=func.now())

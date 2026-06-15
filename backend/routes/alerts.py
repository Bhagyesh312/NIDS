from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
from database import get_db
from models import Prediction
from schemas import AlertOut

router = APIRouter(prefix="/alerts", tags=["alerts"])

@router.get("", response_model=list[AlertOut])
def get_alerts(
    db:       Session  = Depends(get_db),
    limit:    int      = Query(50, ge=1, le=500),
    offset:   int      = Query(0, ge=0),
    type:     Optional[str] = Query(None),   # filter by prediction type
    source:   Optional[str] = Query(None),   # 'single' or 'batch'
):
    q = db.query(Prediction)

    if type:
        q = q.filter(Prediction.prediction == type)
    if source:
        q = q.filter(Prediction.source == source)

    # Exclude normal traffic — only return attacks
    q = q.filter(Prediction.prediction != 'Normal')

    return q.order_by(desc(Prediction.created_at)).offset(offset).limit(limit).all()


@router.get("/count")
def get_alert_count(db: Session = Depends(get_db)):
    """Returns unread attack count for the sidebar badge."""
    count = db.query(Prediction).filter(
        Prediction.prediction != 'Normal'
    ).count()
    return {"count": count}


@router.get("/all", response_model=list[AlertOut])
def get_all(
    db:    Session = Depends(get_db),
    limit: int     = Query(100, ge=1, le=1000),
):
    """All predictions including normal traffic."""
    return db.query(Prediction).order_by(
        desc(Prediction.created_at)
    ).limit(limit).all()

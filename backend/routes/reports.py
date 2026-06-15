from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from database import get_db
from models import Prediction

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    """Weekly and monthly attack breakdown for the Reports page."""

    # Total per category
    category_counts = db.query(
        Prediction.prediction,
        func.count(Prediction.id).label('count')
    ).group_by(Prediction.prediction).all()

    category_stats = [
        {'name': r.prediction, 'total': r.count}
        for r in category_counts
    ]

    # Daily counts for last 7 days
    daily = db.query(
        func.date(Prediction.created_at).label('day'),
        Prediction.prediction,
        func.count(Prediction.id).label('count')
    ).group_by(
        func.date(Prediction.created_at),
        Prediction.prediction
    ).order_by(func.date(Prediction.created_at)).all()

    # Top source IPs
    top_ips = db.query(
        Prediction.src_ip,
        Prediction.prediction,
        func.count(Prediction.id).label('count')
    ).filter(
        Prediction.src_ip.isnot(None),
        Prediction.prediction != 'Normal'
    ).group_by(
        Prediction.src_ip,
        Prediction.prediction
    ).order_by(func.count(Prediction.id).desc()).limit(10).all()

    return {
        "category_stats": category_stats,
        "daily":          [{'day': str(r.day), 'type': r.prediction, 'count': r.count} for r in daily],
        "top_ips":        [{'ip': r.src_ip, 'type': r.prediction, 'count': r.count} for r in top_ips],
    }

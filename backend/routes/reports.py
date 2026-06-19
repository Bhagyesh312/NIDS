from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from database import get_db
from models import Prediction
import json, os

router = APIRouter(prefix="/reports", tags=["reports"])

_BASE_DIR        = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_MODEL_INFO_PATH = os.path.join(_BASE_DIR, 'models', 'model_info.json')


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

    # Monthly counts (last 12 months) — attacks vs normal
    monthly_raw = db.query(
        func.strftime('%Y-%m', Prediction.created_at).label('month'),
        Prediction.prediction,
        func.count(Prediction.id).label('count')
    ).group_by(
        func.strftime('%Y-%m', Prediction.created_at),
        Prediction.prediction
    ).order_by(func.strftime('%Y-%m', Prediction.created_at)).all()

    # Pivot monthly into {month, attacks, normal}
    monthly_map = {}
    for r in monthly_raw:
        if r.month not in monthly_map:
            monthly_map[r.month] = {'month': r.month, 'attacks': 0, 'normal': 0}
        if r.prediction == 'Normal':
            monthly_map[r.month]['normal'] += r.count
        else:
            monthly_map[r.month]['attacks'] += r.count
    # Format month label as short month name
    import calendar
    monthly_list = []
    for key in sorted(monthly_map)[-12:]:
        entry = monthly_map[key]
        try:
            yr, mo = key.split('-')
            label = calendar.month_abbr[int(mo)]
        except Exception:
            label = key
        monthly_list.append({'month': label, 'attacks': entry['attacks'], 'normal': entry['normal']})

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

    # Real detection rate from model_info.json
    detection_rate = None
    if os.path.exists(_MODEL_INFO_PATH):
        try:
            with open(_MODEL_INFO_PATH) as f:
                info = json.load(f)
            if info.get('val_accuracy') is not None:
                detection_rate = f"{info['val_accuracy'] * 100:.2f}%"
        except Exception:
            pass

    return {
        "category_stats": category_stats,
        "daily":          [{'day': str(r.day), 'type': r.prediction, 'count': r.count} for r in daily],
        "monthly":        monthly_list,
        "top_ips":        [{'ip': r.src_ip, 'type': r.prediction, 'count': r.count} for r in top_ips],
        "detection_rate": detection_rate,
    }

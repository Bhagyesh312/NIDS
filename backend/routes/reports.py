import calendar
import json
import os
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db, engine
from models import Prediction

router = APIRouter(prefix="/reports", tags=["reports"])

_BASE_DIR          = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_MODEL_INFO_PATHS  = {
    'kdd':    os.path.join(_BASE_DIR, 'models', 'model_info.json'),
    'cicids': os.path.join(_BASE_DIR, 'models', 'cicids_model_info.json'),
}


@router.get("/summary")
def get_summary(
    model: str = Query('kdd', description="Filter by model: 'kdd' or 'cicids'"),
    db:    Session = Depends(get_db),
):
    """Weekly and monthly attack breakdown for the Reports page."""

    normal_labels = ['Normal', 'Benign']

    # Base query filtered by model
    base_q = db.query(Prediction)
    if model in ('kdd', 'cicids'):
        base_q = base_q.filter(Prediction.model_used == model)

    # Total per category
    category_counts = base_q.with_entities(
        Prediction.prediction,
        func.count(Prediction.id).label('count')
    ).group_by(Prediction.prediction).all()

    category_stats = [
        {'name': r.prediction, 'total': r.count}
        for r in category_counts
    ]

    # Daily counts (last 30 days only — avoid unbounded scan)
    since_30d = datetime.now(timezone.utc) - timedelta(days=30)
    daily_q = db.query(Prediction)
    if model in ('kdd', 'cicids'):
        daily_q = daily_q.filter(Prediction.model_used == model)
    daily_q = daily_q.filter(Prediction.created_at >= since_30d).with_entities(
        func.date(Prediction.created_at).label('day'),
        Prediction.prediction,
        func.count(Prediction.id).label('count')
    ).group_by(
        func.date(Prediction.created_at),
        Prediction.prediction
    ).order_by(func.date(Prediction.created_at))
    daily = daily_q.all()

    # Monthly pivot — use engine dialect to avoid deprecated db.bind
    dialect_name = engine.dialect.name
    if dialect_name == 'postgresql':
        month_expr = func.to_char(Prediction.created_at, 'YYYY-MM')
    else:
        month_expr = func.strftime('%Y-%m', Prediction.created_at)

    monthly_raw = base_q.with_entities(
        month_expr.label('month'),
        Prediction.prediction,
        func.count(Prediction.id).label('count')
    ).group_by(month_expr, Prediction.prediction).order_by(month_expr).all()

    # Determine normal label for this model
    normal_label = 'Benign' if model == 'cicids' else 'Normal'

    monthly_map: dict = {}
    for r in monthly_raw:
        if r.month not in monthly_map:
            monthly_map[r.month] = {'month': r.month, 'attacks': 0, 'normal': 0}
        if r.prediction == normal_label:
            monthly_map[r.month]['normal'] += r.count
        else:
            monthly_map[r.month]['attacks'] += r.count

    monthly_list = []
    for key in sorted(monthly_map)[-12:]:
        entry = monthly_map[key]
        try:
            _, mo = key.split('-')
            label = calendar.month_abbr[int(mo)]
        except Exception:
            label = key
        monthly_list.append({
            'month':   label,
            'attacks': entry['attacks'],
            'normal':  entry['normal'],
        })

    # Top source IPs — exclude normal labels
    top_ips_q = base_q.with_entities(
        Prediction.src_ip,
        Prediction.prediction,
        func.count(Prediction.id).label('count')
    ).filter(
        Prediction.src_ip.isnot(None),
        Prediction.prediction.notin_(normal_labels),
    ).group_by(
        Prediction.src_ip,
        Prediction.prediction,
    ).order_by(func.count(Prediction.id).desc()).limit(10)
    top_ips = top_ips_q.all()

    # Detection rate from correct model_info.json
    info_path      = _MODEL_INFO_PATHS.get(model, _MODEL_INFO_PATHS['kdd'])
    detection_rate = None
    if os.path.exists(info_path):
        try:
            with open(info_path) as f:
                info = json.load(f)
            if info.get('val_accuracy') is not None:
                detection_rate = f"{info['val_accuracy'] * 100:.2f}%"
        except Exception:
            pass

    return {
        "model":          model,
        "category_stats": category_stats,
        "daily":          [{'day': str(r.day), 'type': r.prediction, 'count': r.count} for r in daily],
        "monthly":        monthly_list,
        "top_ips":        [{'ip': r.src_ip, 'type': r.prediction, 'count': r.count} for r in top_ips],
        "detection_rate": detection_rate,
    }

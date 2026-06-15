from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Prediction
from schemas import StatsResponse, ModelInfoResponse

router = APIRouter(tags=["stats"])

@router.get("/stats", response_model=StatsResponse)
def get_stats(db: Session = Depends(get_db)):
    total   = db.query(Prediction).count()
    normal  = db.query(Prediction).filter(Prediction.prediction == 'Normal').count()
    attacks = total - normal

    # Distribution per category
    dist_raw = db.query(
        Prediction.prediction,
        func.count(Prediction.id).label('count')
    ).group_by(Prediction.prediction).all()

    distribution = [{'name': r.prediction, 'value': r.count} for r in dist_raw]

    # Fall back to mock if no data yet
    if total == 0:
        return StatsResponse(
            total=125973, attacks=58630, normal=67343,
            accuracy='97.4%',
            distribution=[
                {'name': 'Normal', 'value': 67343},
                {'name': 'DoS',    'value': 45927},
                {'name': 'Probe',  'value': 11656},
                {'name': 'R2L',    'value': 995  },
                {'name': 'U2R',    'value': 52   },
            ]
        )

    return StatsResponse(
        total        = total,
        attacks      = attacks,
        normal       = normal,
        accuracy     = '97.4%',
        distribution = distribution,
    )


@router.get("/model-info", response_model=ModelInfoResponse)
def get_model_info():
    """Returns static model metadata — update after training."""
    return ModelInfoResponse(
        algorithm  = 'XGBoost',
        dataset    = 'NSL-KDD',
        samples    = 125973,
        features   = 41,
        train_size = '80%',
        confusion_matrix = {
            'labels': ['Normal', 'DoS', 'Probe', 'R2L', 'U2R'],
            'matrix': [
                [13420,  2,  5,  1,  0],
                [    3, 9180, 0,  0,  0],
                [   10,  0, 2320, 12, 0],
                [   18,  0,  5, 178, 0],
                [    2,  0,  0,  0,  8],
            ]
        },
        feature_importance = [
            {'name': 'serror_rate',          'value': 18},
            {'name': 'dst_host_serror_rate', 'value': 15},
            {'name': 'src_bytes',            'value': 12},
            {'name': 'srv_serror_rate',      'value': 10},
            {'name': 'count',                'value':  9},
            {'name': 'same_srv_rate',        'value':  8},
            {'name': 'dst_bytes',            'value':  7},
            {'name': 'logged_in',            'value':  6},
            {'name': 'dst_host_count',       'value':  5},
            {'name': 'flag',                 'value':  4},
        ]
    )


@router.get("/globe-stats")
def get_globe_stats(db: Session = Depends(get_db)):
    """
    Returns attack counts grouped by source IP for the globe page.
    Only returns entries where src_ip was provided.
    """
    results = db.query(
        Prediction.src_ip,
        Prediction.prediction,
        func.count(Prediction.id).label('count')
    ).filter(
        Prediction.src_ip.isnot(None),
        Prediction.prediction != 'Normal'
    ).group_by(
        Prediction.src_ip,
        Prediction.prediction
    ).order_by(
        func.count(Prediction.id).desc()
    ).limit(20).all()

    return [
        {'src_ip': r.src_ip, 'type': r.prediction, 'count': r.count}
        for r in results
    ]

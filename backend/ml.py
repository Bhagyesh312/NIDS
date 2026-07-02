import joblib
import numpy as np
import pandas as pd
import os
from typing import Optional

# Paths
BASE_DIR      = os.path.dirname(os.path.abspath(__file__))
PROCESSED_DIR = os.path.join(BASE_DIR, '..', 'data', 'processed')
MODELS_DIR    = os.path.join(BASE_DIR, '..', 'models')

# ── Per-model artifact cache ──────────────────────────────────────────────────
# Each entry holds: model, scaler, label_encoders, target_encoder, feature_names
_artifacts = {
    'kdd':    {'model': None, 'scaler': None, 'label_encoders': None,
               'target_encoder': None, 'feature_names': None},
    'cicids': {'model': None, 'scaler': None, 'label_encoders': None,
               'target_encoder': None, 'feature_names': None},
}

# ── KDD artifact paths ────────────────────────────────────────────────────────
_KDD_PATHS = {
    'model':          os.path.join(MODELS_DIR,    'model.pkl'),
    'scaler':         os.path.join(PROCESSED_DIR, 'scaler.pkl'),
    'label_encoders': os.path.join(PROCESSED_DIR, 'label_encoders.pkl'),
    'target_encoder': os.path.join(PROCESSED_DIR, 'target_encoder.pkl'),
    'feature_names':  os.path.join(PROCESSED_DIR, 'feature_names.pkl'),
}

# ── CICIDS artifact paths ─────────────────────────────────────────────────────
_CICIDS_PROCESSED_DIR = os.path.join(BASE_DIR, '..', 'data', 'processed', 'cicids')
_CICIDS_PATHS = {
    'model':          os.path.join(MODELS_DIR,          'cicids_model.pkl'),
    'scaler':         os.path.join(_CICIDS_PROCESSED_DIR, 'scaler.pkl'),
    'label_encoders': None,   # CICIDS uses no categorical label encoders
    'target_encoder': os.path.join(_CICIDS_PROCESSED_DIR, 'target_encoder.pkl'),
    'feature_names':  os.path.join(_CICIDS_PROCESSED_DIR, 'feature_names.pkl'),
}


def _load_model_set(key: str, paths: dict) -> bool:
    """Load one model's artifacts into the cache. Returns True on success."""
    a = _artifacts[key]
    try:
        a['model']          = joblib.load(paths['model'])
        a['scaler']         = joblib.load(paths['scaler'])
        a['target_encoder'] = joblib.load(paths['target_encoder'])
        a['feature_names']  = joblib.load(paths['feature_names'])
        if paths.get('label_encoders'):
            a['label_encoders'] = joblib.load(paths['label_encoders'])
        print(f"✓ [{key.upper()}] ML artifacts loaded")
        return True
    except FileNotFoundError as e:
        print(f"⚠ [{key.upper()}] Artifacts not found: {e}")
        return False


def load_artifacts():
    """Load all available model artifacts at startup."""
    kdd_ok    = _load_model_set('kdd',    _KDD_PATHS)
    cicids_ok = _load_model_set('cicids', _CICIDS_PATHS)
    if not kdd_ok:
        print("  Run notebooks/03_model_training.ipynb first to generate models/model.pkl")
    return kdd_ok or cicids_ok


def is_ready(model: str = 'kdd') -> bool:
    return _artifacts.get(model, {}).get('model') is not None


def _get(model: str, key: str):
    return _artifacts.get(model, {}).get(key)


# ── Preprocessing ─────────────────────────────────────────────────────────────

def preprocess(features: dict, model: str = 'kdd') -> Optional[np.ndarray]:
    """Convert raw feature dict to scaled numpy array ready for prediction."""
    if not is_ready(model):
        return None

    scaler        = _get(model, 'scaler')
    label_encoders= _get(model, 'label_encoders')
    feature_names = _get(model, 'feature_names')

    df = pd.DataFrame([features])

    # KDD-specific categorical encoding
    if model == 'kdd' and label_encoders:
        cat_cols = ['protocol_type', 'service', 'flag']
        for col in cat_cols:
            le = label_encoders.get(col)
            if le and col in df.columns:
                df[col] = df[col].apply(
                    # Unknown value → most-frequent class (index 0) instead of -1 sentinel
                    lambda x: le.transform([x])[0] if x in le.classes_ else 0
                )

    # Keep only trained feature columns in correct order
    for col in feature_names:
        if col not in df.columns:
            df[col] = 0
    df = df[feature_names].copy()

    return scaler.transform(df.values.astype(float))


# ── Single prediction ─────────────────────────────────────────────────────────

def predict_single(features: dict, model: str = 'kdd'):
    """Returns (prediction_label, confidence, top_features)"""
    X = preprocess(features, model)
    if X is None:
        return None, None, None

    clf            = _get(model, 'model')
    target_encoder = _get(model, 'target_encoder')
    feature_names  = _get(model, 'feature_names')

    proba     = clf.predict_proba(X)[0]
    pred_idx  = int(np.argmax(proba))
    confidence= float(proba[pred_idx])
    label     = target_encoder.classes_[pred_idx]

    # Top 5 features by feature importance (if XGBoost)
    top_features = None
    try:
        importances = clf.feature_importances_
        top_idx = np.argsort(importances)[::-1][:5]
        top_features = [[feature_names[i], float(importances[i])] for i in top_idx]
    except AttributeError:
        pass

    return label, confidence, top_features


# ── Batch prediction ──────────────────────────────────────────────────────────

def predict_batch(df: pd.DataFrame, model: str = 'kdd'):
    """
    Vectorized batch prediction — preprocesses all rows at once and calls
    clf.predict_proba() once instead of once per row.
    Returns list of {'prediction': label, 'confidence': float}.
    """
    if not is_ready(model):
        return []

    clf            = _get(model, 'model')
    target_encoder = _get(model, 'target_encoder')
    scaler         = _get(model, 'scaler')
    label_encoders = _get(model, 'label_encoders')
    feature_names  = _get(model, 'feature_names')

    # KDD categorical encoding
    if model == 'kdd' and label_encoders:
        for col in ['protocol_type', 'service', 'flag']:
            le = label_encoders.get(col)
            if le and col in df.columns:
                # Map known values; unknown → most-frequent class (index 0)
                known = set(le.classes_)
                df[col] = df[col].apply(
                    lambda x: le.transform([x])[0] if x in known else 0
                )

    # Align columns to trained feature set
    for col in feature_names:
        if col not in df.columns:
            df[col] = 0
    X = df[feature_names].values.astype(float)

    X_scaled = scaler.transform(X)
    proba    = clf.predict_proba(X_scaled)
    pred_idx = proba.argmax(axis=1)
    confs    = proba[range(len(pred_idx)), pred_idx]
    labels   = [target_encoder.classes_[i] for i in pred_idx]

    return [
        {'prediction': label, 'confidence': float(conf)}
        for label, conf in zip(labels, confs)
    ]


# ── Metadata helpers ──────────────────────────────────────────────────────────

def get_feature_names(model: str = 'kdd'):
    return _get(model, 'feature_names') or []

def get_target_classes(model: str = 'kdd'):
    te = _get(model, 'target_encoder')
    return list(te.classes_) if te else []

def get_available_models():
    """Return which models have been loaded successfully."""
    return {k: is_ready(k) for k in _artifacts}

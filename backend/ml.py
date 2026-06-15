import joblib
import numpy as np
import pandas as pd
import os
from typing import Optional

# Paths
BASE_DIR      = os.path.dirname(os.path.abspath(__file__))
PROCESSED_DIR = os.path.join(BASE_DIR, '..', 'data', 'processed')
MODELS_DIR    = os.path.join(BASE_DIR, '..', 'models')

# Load artifacts at startup — cached in memory
_model           = None
_scaler          = None
_label_encoders  = None
_target_encoder  = None
_feature_names   = None

def load_artifacts():
    global _model, _scaler, _label_encoders, _target_encoder, _feature_names
    try:
        _model          = joblib.load(os.path.join(MODELS_DIR,    'model.pkl'))
        _scaler         = joblib.load(os.path.join(PROCESSED_DIR, 'scaler.pkl'))
        _label_encoders = joblib.load(os.path.join(PROCESSED_DIR, 'label_encoders.pkl'))
        _target_encoder = joblib.load(os.path.join(PROCESSED_DIR, 'target_encoder.pkl'))
        _feature_names  = joblib.load(os.path.join(PROCESSED_DIR, 'feature_names.pkl'))
        print("✓ ML artifacts loaded successfully")
        return True
    except FileNotFoundError as e:
        print(f"⚠ Model not found: {e}")
        print("  Run notebooks/03_model_training.ipynb first to generate models/model.pkl")
        return False

def is_ready() -> bool:
    return _model is not None

def preprocess(features: dict) -> Optional[np.ndarray]:
    """Convert raw feature dict to scaled numpy array ready for prediction."""
    if not is_ready():
        return None

    df = pd.DataFrame([features])

    # Encode categorical columns
    cat_cols = ['protocol_type', 'service', 'flag']
    for col in cat_cols:
        le = _label_encoders.get(col)
        if le and col in df.columns:
            df[col] = df[col].apply(
                lambda x: le.transform([x])[0] if x in le.classes_ else -1
            )

    # Keep only trained feature columns in correct order
    for col in _feature_names:
        if col not in df.columns:
            df[col] = 0
    df = df[_feature_names]

    # Scale
    return _scaler.transform(df.values)

def predict_single(features: dict):
    """Returns (prediction_label, confidence, top_features)"""
    X = preprocess(features)
    if X is None:
        return None, None, None

    proba = _model.predict_proba(X)[0]
    pred_idx = int(np.argmax(proba))
    confidence = float(proba[pred_idx])
    label = _target_encoder.classes_[pred_idx]

    # Top 5 features by feature importance (if XGBoost)
    top_features = None
    try:
        importances = _model.feature_importances_
        top_idx = np.argsort(importances)[::-1][:5]
        top_features = [[_feature_names[i], float(importances[i])] for i in top_idx]
    except AttributeError:
        pass

    return label, confidence, top_features

def predict_batch(df: pd.DataFrame):
    """Returns list of (label, confidence) for each row."""
    if not is_ready():
        return []

    results = []
    for _, row in df.iterrows():
        label, conf, _ = predict_single(row.to_dict())
        results.append({'prediction': label or 'Unknown', 'confidence': conf or 0.0})
    return results

def get_feature_names():
    return _feature_names or []

def get_target_classes():
    return list(_target_encoder.classes_) if _target_encoder else []

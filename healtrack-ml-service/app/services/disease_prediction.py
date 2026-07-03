import os
import numpy as np
import joblib
from pathlib import Path
from typing import List, Dict, Any
from app.services.risk_tiers import get_risk_tier, HIGH_SEVERITY_DISEASES

BASE_DIR = Path(__file__).resolve().parents[2]
TRAINED_MODELS_DIR = BASE_DIR / "trained_models"

# Lazy load artifacts to save memory/startup time
_artifacts = {}

def load_artifacts():
    if not _artifacts:
        _artifacts["model"] = joblib.load(TRAINED_MODELS_DIR / "disease_model.pkl")
        _artifacts["encoder"] = joblib.load(TRAINED_MODELS_DIR / "label_encoder.pkl")
        _artifacts["symptom_weights"] = joblib.load(TRAINED_MODELS_DIR / "symptom_weights.pkl")
        _artifacts["symptom_list"] = joblib.load(TRAINED_MODELS_DIR / "symptom_list.pkl")
        _artifacts["disease_descriptions"] = joblib.load(TRAINED_MODELS_DIR / "disease_descriptions.pkl")
        _artifacts["disease_precautions"] = joblib.load(TRAINED_MODELS_DIR / "disease_precautions.pkl")
    return _artifacts

def build_feature_vector(symptoms: List[str]):
    art = load_artifacts()
    sym_list = art["symptom_list"]
    sym_weights = art["symptom_weights"]
    
    feature_vector = np.zeros(len(sym_list))
    recognized = []
    unrecognized = []

    for sym in symptoms:
        sym_clean = sym.strip().lower().replace(' ', '_')
        if sym_clean in sym_weights:
            recognized.append(sym)
            if sym_clean in sym_list:
                idx = sym_list.index(sym_clean)
                feature_vector[idx] = sym_weights[sym_clean]
        else:
            unrecognized.append(sym)

    return feature_vector, recognized, unrecognized

def get_all_symptoms() -> List[str]:
    art = load_artifacts()
    return sorted(list(art["symptom_weights"].keys()))

def get_all_diseases() -> List[str]:
    art = load_artifacts()
    return sorted(list(art["encoder"].classes_))

def predict_disease_from_symptoms(symptoms: List[str]) -> Dict[str, Any]:
    art = load_artifacts()
    model = art["model"]
    encoder = art["encoder"]
    desc_lookup = art["disease_descriptions"]
    prec_lookup = art["disease_precautions"]

    feature_vector, recognized, unrecognized = build_feature_vector(symptoms)

    if not recognized:
        return {
            "success": False,
            "error": "No recognized symptoms provided",
            "recognized": recognized,
            "unrecognized": unrecognized,
            "predictions": []
        }

    proba = model.predict_proba([feature_vector])[0]
    top_indices = np.argsort(proba)[::-1][:3]

    predictions = []
    for idx in top_indices:
        disease = encoder.classes_[idx]
        confidence = round(float(proba[idx]) * 100, 2)

        # Skip high-severity diseases if they have low confidence (under 45%) to avoid unnecessary panic
        if disease in HIGH_SEVERITY_DISEASES and confidence < 45:
            continue

        predictions.append({
            "rank": len(predictions) + 1,
            "disease": disease,
            "confidence": confidence,
            "risk_tier": get_risk_tier(disease, confidence),
            "description": desc_lookup.get(disease, "Description not available."),
            "precautions": prec_lookup.get(disease, [])
        })

    return {
        "success": True,
        "input_symptoms": symptoms,
        "unrecognized_symptoms": unrecognized,
        "predictions": predictions
    }

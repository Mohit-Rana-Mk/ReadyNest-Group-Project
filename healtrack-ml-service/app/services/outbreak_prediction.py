import os
import joblib
import numpy as np
from pathlib import Path
from typing import List, Dict, Any

BASE_DIR = Path(__file__).resolve().parents[2]
MODEL_PATH = BASE_DIR / "trained_models" / "outbreak_model.pkl"

_model = None

def load_outbreak_model():
    global _model
    if _model is None:
        if os.path.exists(MODEL_PATH):
            _model = joblib.load(MODEL_PATH)
        else:
            raise FileNotFoundError(f"Outbreak prediction model not found at {MODEL_PATH}")
    return _model

def predict_outbreak_risk(disease_cases: List[Dict[str, Any]], season_index: int, density_score: int) -> List[Dict[str, Any]]:
    """
    disease_cases: list of dict, e.g. [{"disease": "Dengue", "recent_cases": 12, "prior_cases": 6}]
    """
    model = load_outbreak_model()
    results = []

    for item in disease_cases:
        disease = item.get("disease", "Unknown")
        recent = item.get("recent_cases", 0)
        prior = item.get("prior_cases", 0)
        
        # Calculate growth rate (recent / prior)
        growth_rate = recent / max(1, prior)
        
        # Feature array: [recent_cases_count, growth_rate, season_index, population_density_score]
        features = np.array([[recent, growth_rate, season_index, density_score]])
        
        # Get prediction and probabilities
        pred_class = int(model.predict(features)[0])
        probabilities = model.predict_proba(features)[0]
        
        # Class 0: Low, Class 1: Medium, Class 2: High
        risk_map = {0: "Low", 1: "Medium", 2: "High"}
        risk_tier = risk_map.get(pred_class, "Low")
        confidence = float(probabilities[pred_class]) * 100

        # Generate recommendation message
        recommendation = ""
        if risk_tier == "High":
            recommendation = f"Urgent outbreak warning for {disease}! Case counts have spiked dramatically. Establish immediate community containment, issue public mask-wearing or vaccination advice, and notify local health ministries."
        elif risk_tier == "Medium":
            recommendation = f"Alert: Elevated caseload trend observed for {disease}. Public awareness, sanitization campaigns, and diagnostic scaling are recommended to prevent further spread."
        else:
            recommendation = f"Caseload for {disease} remains within normal baseline thresholds. Continue routine active epidemiological surveillance."

        results.append({
            "disease": disease,
            "recent_cases": recent,
            "prior_cases": prior,
            "growth_rate": round(growth_rate, 2),
            "risk_tier": risk_tier,
            "confidence": round(confidence, 2),
            "recommendation": recommendation
        })

    return results

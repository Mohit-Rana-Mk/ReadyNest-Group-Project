from typing import Dict


MAX_RISK_SCORE = 100.0


def normalize(score: float) -> float:
    """
    Keep all risk scores within 0–100.
    """
    return round(min(MAX_RISK_SCORE, max(0.0, score)), 2)


def calculate_risks(features: Dict) -> Dict[str, float]:
    """
    Multi-Disease Clinical Risk Engine

    Calculates estimated risk scores for:
    - Diabetes
    - Heart Disease
    - Hypertension
    - Kidney Disease
    """

    glucose = features.get("Glucose", 0.0)
    blood_pressure = features.get("BloodPressure", 0.0)
    bmi = features.get("BMI", 0.0)
    age = features.get("Age", 0.0)
    insulin = features.get("Insulin", 0.0)

    risks = {
        "diabetes": normalize(
            glucose * 0.40 +
            bmi * 0.30 +
            age * 0.20
        ),

        "heart": normalize(
            blood_pressure * 0.50 +
            bmi * 0.20 +
            age * 0.30
        ),

        "hypertension": normalize(
            blood_pressure * 0.80 +
            age * 0.20
        ),

        "kidney": normalize(
            glucose * 0.30 +
            blood_pressure * 0.30 +
            insulin * 0.20
        ),
    }

    return risks
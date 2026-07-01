from app.services.multi_disease_risk_engine import calculate_risks
from app.services.recommendation_engine import generate_recommendations


CRITICAL_THRESHOLD = 80
HIGH_THRESHOLD = 60


def generate_alerts(risks: dict) -> list[str]:
    """
    Generate medical alerts based on calculated disease risks.
    """

    alerts = []

    highest_risk = max(risks.values())

    if highest_risk >= CRITICAL_THRESHOLD:
        alerts.append("🔴 CRITICAL RISK: Immediate medical attention required.")

    elif highest_risk >= HIGH_THRESHOLD:
        alerts.append("🟠 HIGH RISK: Schedule a doctor consultation within 24-48 hours.")

    else:
        alerts.append("🟢 LOW RISK: Continue maintaining a healthy lifestyle.")

    return alerts


def run_triage(patient_data: dict) -> dict:
    """
    Main Clinical Decision Engine

    Workflow:
    1. Calculate disease risks
    2. Generate recommendations
    3. Generate alerts
    4. Return unified response
    """

    risks = calculate_risks(patient_data)

    recommendations = generate_recommendations(
        risks=risks,
        patient_data=patient_data,
    )

    alerts = generate_alerts(risks)

    return {
        "risks": risks,
        "recommendations": recommendations,
        "alerts": alerts,
    }
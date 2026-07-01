from typing import Dict


HIGH_RISK = 60
MEDIUM_RISK = 40


def generate_recommendations(risks: Dict, patient_data: Dict) -> Dict:
    """
    Recommendation Engine

    Generates:
    - Specialist Doctors
    - Hospital Departments
    - Suggested Diagnostic Tests
    - Lifestyle Recommendations
    - Visit Priority
    """

    doctors = set()
    departments = set()
    tests = set()
    lifestyle = []

    highest_risk = max(risks.values())

    # ----------------------------
    # Diabetes
    # ----------------------------

    if risks["diabetes"] >= HIGH_RISK:
        doctors.add("Endocrinologist")
        departments.add("Endocrinology")
        tests.update([
            "HbA1c",
            "Fasting Blood Sugar",
            "Postprandial Blood Sugar"
        ])

    # ----------------------------
    # Heart Disease
    # ----------------------------

    if risks["heart"] >= HIGH_RISK:
        doctors.add("Cardiologist")
        departments.add("Cardiology")
        tests.update([
            "ECG",
            "2D Echo",
            "Lipid Profile"
        ])

    # ----------------------------
    # Hypertension
    # ----------------------------

    if risks["hypertension"] >= HIGH_RISK:
        doctors.add("General Physician")
        departments.add("Internal Medicine")
        tests.update([
            "Blood Pressure Monitoring",
            "Electrolyte Test"
        ])

    # ----------------------------
    # Kidney Disease
    # ----------------------------

    if risks["kidney"] >= HIGH_RISK:
        doctors.add("Nephrologist")
        departments.add("Nephrology")
        tests.update([
            "Kidney Function Test",
            "Urine Analysis",
            "Creatinine Test"
        ])

    # ----------------------------
    # Lifestyle Recommendations
    # ----------------------------

    if highest_risk >= HIGH_RISK:

        visit_priority = "High"

        lifestyle = [
            "Follow a low-sugar, low-salt diet.",
            "Avoid processed and fried foods.",
            "Walk at least 30 minutes daily.",
            "Maintain a healthy body weight.",
            "Monitor blood pressure and blood sugar regularly.",
            "Avoid smoking and alcohol.",
            "Sleep 7–8 hours every night.",
            "Consult a specialist immediately."
        ]

    elif highest_risk >= MEDIUM_RISK:

        visit_priority = "Medium"

        lifestyle = [
            "Maintain a balanced diet.",
            "Exercise 150 minutes per week.",
            "Drink adequate water.",
            "Reduce stress through yoga or meditation.",
            "Monitor health parameters weekly."
        ]

    else:

        visit_priority = "Routine"

        lifestyle = [
            "Continue a healthy lifestyle.",
            "Annual preventive health check-up.",
            "Maintain regular physical activity."
        ]

    return {

        "doctors": sorted(doctors),

        "departments": sorted(departments),

        "tests": sorted(tests),

        "lifestyle": lifestyle,

        "visit_priority": visit_priority

    }
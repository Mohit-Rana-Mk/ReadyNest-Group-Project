def explain_risk(features, risk_percentage):

    explanations = []

    # Glucose impact
    if features.get("Glucose", 0) > 140:
        explanations.append("High glucose level significantly increases diabetes risk")

    # BMI impact
    if features.get("BMI", 0) > 30:
        explanations.append("High BMI indicates obesity-related risk factors")

    # Blood pressure
    if features.get("BloodPressure", 0) > 90:
        explanations.append("Elevated blood pressure contributes to metabolic risk")

    # Age factor
    if features.get("Age", 0) > 45:
        explanations.append("Age increases likelihood of chronic disease risk")

    # General risk interpretation
    if risk_percentage >= 70:
        explanations.append("Model indicates high probability of diabetes presence")
    elif risk_percentage >= 40:
        explanations.append("Moderate risk detected requiring lifestyle intervention")
    else:
        explanations.append("Low risk detected, maintain preventive care")

    return explanations
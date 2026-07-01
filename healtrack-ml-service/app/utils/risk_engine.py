def get_risk_level(risk_percentage):

    if risk_percentage < 20:
        return "Very Low"

    elif risk_percentage < 40:
        return "Low"

    elif risk_percentage < 60:
        return "Moderate"

    elif risk_percentage < 80:
        return "High"

    else:
        return "Critical"
    
def calculate_health_score(risk_percentage):

    score = 100 - risk_percentage

    if score < 0:
        score = 0

    return round(score, 2)

def get_recommendations(risk_percentage):

    recommendations = []

    if risk_percentage > 70:
        recommendations.append("Immediate medical consultation required")

    if risk_percentage > 50:
        recommendations.append("Reduce sugar and processed food")

    if risk_percentage > 40:
        recommendations.append("Start daily exercise (30 mins)")

    if risk_percentage <= 40:
        recommendations.append("Maintain healthy lifestyle")

    return recommendations
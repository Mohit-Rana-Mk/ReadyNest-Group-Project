"""
Single source of truth for the disease severity sets and the
disease + confidence -> Low / Moderate / High / Urgent mapping.
"""

HIGH_SEVERITY_DISEASES = {
    'Heart attack', 'AIDS', 'Tuberculosis', 'Hepatitis B',
    'Hepatitis C', 'Hepatitis D', 'Hepatitis E', 'hepatitis A',
    'Alcoholic hepatitis', 'Malaria', 'Dengue', 'Typhoid',
    'Pneumonia', 'Paralysis (brain hemorrhage)', 'Diabetes',
    'Hypertension', 'Hypoglycemia'
}

MODERATE_SEVERITY_DISEASES = {
    'Chronic cholestasis', 'Jaundice', 'Migraine', 'Arthritis',
    'Osteoarthristis', 'Cervical spondylosis', 'Hypothyroidism',
    'Hyperthyroidism', 'Urinary tract infection', 'Bronchial Asthma',
    'Varicose veins', 'GERD', 'Peptic ulcer diseae',
    'Dimorphic hemmorhoids(piles)', 'Gastroenteritis',
    '(vertigo) Paroymsal  Positional Vertigo'
}


def get_risk_tier(disease: str, confidence: float) -> str:
    """
    Maps predicted disease + confidence score (0-100) to a risk tier.
    Feeds the dashboard's alert and notification trigger.
    """
    if disease in HIGH_SEVERITY_DISEASES:
        if confidence >= 75:
            return "Urgent"
        elif confidence >= 50:
            return "High"
        else:
            return "Moderate"
    elif disease in MODERATE_SEVERITY_DISEASES:
        if confidence >= 75:
            return "High"
        elif confidence >= 50:
            return "Moderate"
        else:
            return "Low"
    else:
        if confidence >= 85:
            return "Moderate"
        else:
            return "Low"
# app/services/prediction_service.py
import pandas as pd
from app.models.model_loader import model, scaler
from app.utils.risk_engine import (
    get_risk_level,
    calculate_health_score,
    get_recommendations
)
from app.utils.logger import logger

def predict_diabetes(patient: dict) -> dict:
    try:
        # 1. Basic Anomaly Check: catch missing values or data frame structural flags
        if not patient or len(patient) == 0:
            raise ValueError("Input client features are entirely empty.")

        input_df = pd.DataFrame([patient])
        
        # 2. Check for missing columns or NaN parameters
        if input_df.isnull().values.any():
            logger.warning(f"Anomaly detected: Input contains null references -> {patient}")

        # 3. Model Operations Execution
        scaled_data = scaler.transform(input_df)
        prediction = model.predict(scaled_data)
        probability = model.predict_proba(scaled_data)

        # 4. Extract Risk Array Coordinates
        risk = probability[0][1] * 100
        risk_percentage = round(risk, 2)
        confidence = round(max(probability[0]) * 100, 2)

        # Log trace successful calculation paths
        logger.info(f"Successful inference run. Risk: {risk_percentage}%, Level: {get_risk_level(risk_percentage)}")

        # 5. NOW UPDATE RETURN LOGIC
        return {
            "prediction": "Diabetes Risk Detected" if prediction[0] == 1 else "No Diabetes Risk",
            "risk_percentage": risk_percentage,
            "risk_level": get_risk_level(risk_percentage),
            "health_score": calculate_health_score(risk_percentage),
            "recommendations": get_recommendations(risk_percentage),
            "confidence": confidence
        }

    except Exception as error:
        # Fallback layer prevents system runtime failures
        logger.error(f"Inference execution failure crashed: {str(error)}", exc_info=True)
        return {
            "prediction": "System Processing Error",
            "risk_percentage": 0.0,
            "risk_level": "Unknown",
            "health_score": 0.0,
            "recommendations": ["Please contact system administrator. Computation failed."],
            "confidence": 0.0
        }

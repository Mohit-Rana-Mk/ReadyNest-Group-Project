from fastapi import APIRouter, HTTPException, status

from app.validation.schemas import (
    PatientInput,
    PredictionResponse,
)

from app.services.triage_engine import run_triage
from app.database.prediction_repository import save_prediction
from app.utils.audit_logger import log_prediction

router = APIRouter(
    prefix="/api/v1",
    tags=["Risk Prediction"],
)


@router.post(
    "/predict",
    response_model=PredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Predict Patient Health Risks",
    description="""
Predicts multiple disease risks and returns:

• Disease Risk Scores
• Medical Alerts
• Recommended Doctors
• Recommended Departments
• Suggested Diagnostic Tests
• Lifestyle & Diet Recommendations
• Visit Priority
""",
)
def predict(patient: PatientInput):

    try:
        # Convert request to dictionary
        input_data = patient.model_dump()

        # Run AI Risk Prediction Engine
        result = run_triage(input_data)

        # Save prediction history (does not stop API if DB fails)
        try:
            save_prediction(input_data, result)
        except Exception as db_error:
            log_prediction(f"Database Save Failed: {db_error}")

        return result

    except Exception as error:
        log_prediction(f"Prediction Failed: {error}")

        raise HTTPException(
            status_code=500,
            detail="Internal Server Error: Prediction Engine Failed",
        )
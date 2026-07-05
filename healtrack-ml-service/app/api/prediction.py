from fastapi import APIRouter, HTTPException, status

from app.validation.schemas import (
    PatientInput,
    PredictionResponse,
    DiseasePredictInput,
    OutbreakPredictInput,
    OutbreakPredictResponse,
    ParkinsonTestsInput,
)
from app.services.parkinsons_prediction import predict_parkinsons_full, predict_from_tests

from app.services.triage_engine import run_triage
from app.database.prediction_repository import save_prediction
from app.utils.audit_logger import log_prediction
from app.services.disease_prediction import (
    predict_disease_from_symptoms,
    get_all_symptoms,
    get_all_diseases,
)
from app.services.outbreak_prediction import predict_outbreak_risk

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


@router.post(
    "/predict/disease",
    status_code=status.HTTP_200_OK,
    summary="Predict Disease from Symptoms",
)
def predict_disease(input_data: DiseasePredictInput):
    try:
        result = predict_disease_from_symptoms(input_data.symptoms)
        return result
    except Exception as error:
        log_prediction(f"Disease Prediction Failed: {error}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal Server Error: Disease prediction failed: {str(error)}",
        )


@router.get(
    "/symptoms",
    status_code=status.HTTP_200_OK,
    summary="Get List of All Symptoms",
)
def get_symptoms():
    try:
        return get_all_symptoms()
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Internal Server Error: Failed to load symptoms: {str(error)}",
        )


@router.get(
    "/diseases",
    status_code=status.HTTP_200_OK,
    summary="Get List of All Diseases",
)
def get_diseases():
    try:
        return get_all_diseases()
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Internal Server Error: Failed to load diseases: {str(error)}",
        )


@router.get(
    "/disease-info/{disease_name}",
    status_code=status.HTTP_200_OK,
    summary="Get description and precautions for a specific disease",
)
def get_disease_info(disease_name: str):
    try:
        from app.services.disease_prediction import load_artifacts
        art = load_artifacts()
        desc_lookup = art["disease_descriptions"]
        prec_lookup = art["disease_precautions"]
        encoder = art["encoder"]
        
        # Match case-insensitively
        matched_disease = None
        for cls in encoder.classes_:
            if cls.lower().strip() == disease_name.lower().strip():
                matched_disease = cls
                break
                
        if not matched_disease:
            # Try substring match
            for cls in encoder.classes_:
                if disease_name.lower().strip() in cls.lower().strip():
                    matched_disease = cls
                    break

        if not matched_disease:
            raise HTTPException(status_code=404, detail="Disease not found")

        from app.services.risk_tiers import get_risk_tier
        
        return {
            "success": True,
            "disease": matched_disease,
            "description": desc_lookup.get(matched_disease, "Description not available."),
            "precautions": prec_lookup.get(matched_disease, []),
            "risk_tier": get_risk_tier(matched_disease, 100.0)
        }
    except HTTPException as e:
        raise e
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Internal Server Error: {str(error)}",
        )


@router.post(
    "/predict/outbreak",
    response_model=OutbreakPredictResponse,
    status_code=status.HTTP_200_OK,
    summary="Predict Disease Outbreak Risk",
)
def predict_outbreak(input_data: OutbreakPredictInput):
    try:
        raw_cases = [{"disease": c.disease, "recent_cases": c.recent_cases, "prior_cases": c.prior_cases} for c in input_data.disease_cases]
        results = predict_outbreak_risk(raw_cases, input_data.season_index, input_data.density_score)
        return {
            "success": True,
            "results": results
        }
    except Exception as error:
        log_prediction(f"Outbreak Prediction Failed: {error}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal Server Error: Outbreak prediction engine failed: {str(error)}",
        )


@router.post(
    "/predict/parkinsons",
    status_code=status.HTTP_200_OK,
    summary="Predict Parkinson's from 22 voice features",
)
def predict_parkinsons(input_data: dict):
    try:
        return predict_parkinsons_full(input_data)
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Internal Server Error: Parkinson's prediction failed: {str(error)}",
        )


@router.post(
    "/predict/parkinsons/from-tests",
    status_code=status.HTTP_200_OK,
    summary="Predict Parkinson's risk from home tests",
)
def predict_parkinsons_from_tests(input_data: ParkinsonTestsInput):
    try:
        return predict_from_tests(input_data.model_dump())
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Internal Server Error: Parkinson's test prediction failed: {str(error)}",
        )

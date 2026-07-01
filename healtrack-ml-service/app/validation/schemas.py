from pydantic import BaseModel, Field
from typing import List


# -------------------------------
# Input Schema
# -------------------------------

class PatientInput(BaseModel):
    Pregnancies: int = Field(..., ge=0, le=20)
    Glucose: float = Field(..., ge=0)
    BloodPressure: float = Field(..., ge=0)
    SkinThickness: float = Field(..., ge=0)
    Insulin: float = Field(..., ge=0)
    BMI: float = Field(..., ge=0)
    DiabetesPedigreeFunction: float = Field(..., ge=0)
    Age: int = Field(..., ge=0)


# -------------------------------
# Risk Scores
# -------------------------------

class RiskScores(BaseModel):
    diabetes: float
    heart: float
    hypertension: float
    kidney: float


# -------------------------------
# Recommendation Engine
# -------------------------------

class RecommendationResponse(BaseModel):
    doctors: List[str]
    departments: List[str]
    tests: List[str]
    lifestyle: List[str]
    visit_priority: str


# -------------------------------
# Final API Response
# -------------------------------

class PredictionResponse(BaseModel):
    risks: RiskScores
    recommendations: RecommendationResponse
    alerts: List[str]
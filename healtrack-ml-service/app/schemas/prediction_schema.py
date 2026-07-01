# app/schemas/prediction_schema.py
from pydantic import BaseModel, Field

class DiseasePredictionResponse(BaseModel):
    prediction: str = Field(..., description="Human-readable classification outcome")
    risk_percentage: float = Field(..., description="Calculated metric from prediction probability")
    risk_level: str = Field(..., description="Categorized tier ranking from risk percentage")
    health_score: float = Field(..., description="Inversed baseline score representing wellness indicator")
    confidence: float = Field(..., description="Model operational certainty index")
    recommendations: list[str] = Field(..., description="Dynamic list of clinical or physiological recommendations")

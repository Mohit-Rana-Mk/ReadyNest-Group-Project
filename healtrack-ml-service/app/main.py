from fastapi import FastAPI
from app.api.prediction import router as prediction_router

app = FastAPI(
    title="HealTrack AI - Risk Prediction & Recommendation Service",
    description="""
AI-powered healthcare microservice for:

• Multi-Disease Risk Prediction
• Clinical Recommendation Engine
• Medical Alert System
• Explainable AI Support
""",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.include_router(prediction_router)


@app.get("/", tags=["Health"])
def health_check():
    return {
        "service": "HealTrack AI Risk Prediction Service",
        "status": "Running",
        "version": "1.0.0",
    }
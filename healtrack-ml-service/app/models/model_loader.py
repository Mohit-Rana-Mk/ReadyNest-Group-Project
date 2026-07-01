import joblib
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]

MODEL_PATH = BASE_DIR / "trained_models" / "diabetes_model.pkl"

SCALER_PATH = BASE_DIR / "trained_models" / "scaler.pkl"

model = joblib.load(MODEL_PATH)

scaler = joblib.load(SCALER_PATH)
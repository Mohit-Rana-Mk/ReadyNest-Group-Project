from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict
from typing import List
import numpy as np
import joblib
import os

BASE      = os.path.dirname(os.path.abspath(__file__))
ARTIFACTS = os.path.join(BASE, "model_artifacts")

# Check artifacts folder exists before trying to load
if not os.path.exists(ARTIFACTS):
    raise RuntimeError(
        f"'{ARTIFACTS}' folder not found. "
        "Please run train.py first to generate model artifacts."
    )

def _load_artifact(filename: str):
    path = os.path.join(ARTIFACTS, filename)
    try:
        return joblib.load(path)
    except FileNotFoundError:
        raise RuntimeError(
            f"Missing artifact '{path}'. Please run train.py to regenerate "
            f"model_artifacts/ before starting the API."
        )
    except Exception as e:
        raise RuntimeError(f"Failed to load artifact '{path}': {e}")


model       = _load_artifact("disease_model.pkl")
encoder     = _load_artifact("label_encoder.pkl")
sym_weights = _load_artifact("symptom_weights.pkl")
sym_list    = _load_artifact("symptom_list.pkl")
desc_lookup = _load_artifact("disease_descriptions.pkl")
prec_lookup = _load_artifact("disease_precautions.pkl")

print("All artifacts loaded successfully.")
print(f"Model supports {len(encoder.classes_)} diseases")
print(f"Valid symptoms : {len(sym_weights)}")


# RISK TIER LOGIC
'''
Imported from risk_tiers.py — the single source of truth shared with
train.py, so the two can never drift out of sync with each other.
disease + confidence → Low / Moderate / High / Urgent
'''
from risk_tiers import get_risk_tier



# FASTAPI APP

app = FastAPI(
    title="HealTrack Disease Prediction API",
    description="AI-powered disease prediction from patient symptoms",
    version="1.0.0"
)

# NOTE: allow_origins=["*"] together with allow_credentials=True is
# invalid per the CORS spec — browsers will reject it. Since this API
# doesn't use cookies/auth headers, credentials are disabled below.
# If you later add auth, replace "*" with an explicit list of trusted
# origins and set allow_credentials=True.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REQUEST AND RESPONSE MODELS

class PredictRequest(BaseModel):

    symptoms : List[str]

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "symptoms": ["fatigue", "weight_loss", "polyuria", "excessive_hunger"]
            }
        }
    )


class SinglePrediction(BaseModel):
    """One predicted disease with all its associated data"""
    rank        : int
    disease     : str
    confidence  : float        # percentage e.g. 87.5
    risk_tier   : str          # Low / Moderate / High / Urgent
    description : str          # plain language disease description
    precautions : List[str]    # list of up to 4 recommended precautions


class PredictResponse(BaseModel):
    success               : bool
    input_symptoms        : List[str]
    unrecognized_symptoms : List[str]          # symptoms that didn't match any known name
    predictions           : List[SinglePrediction]   # always top 3



# HELPER — BUILD FEATURE VECTOR

'''
Converts a list of symptom strings into a numeric array that the trained model can understand. 
This is the same encoding logic used during training
'''
def build_feature_vector(symptoms: List[str]):
    """
    Takes patient symptom strings → returns:
      - numpy array of severity weights, in the exact column order the
        model was trained on
      - list of symptoms that were recognised
      - list of symptoms that were NOT recognised (typos / unknown names)

    Unknown symptoms are dropped from the feature vector (same behavior
    as before) but are now reported back to the caller instead of being
    silently swallowed, so a frontend can surface "we didn't recognise
    'feever'" instead of just getting a vaguer prediction.
    """
    feature_vector = np.zeros(len(sym_list))
    recognized = []
    unrecognized = []

    for sym in symptoms:
        # Clean the symptom string to match training format
        sym_clean = sym.strip().lower().replace(' ', '_')

        if sym_clean in sym_weights:
            recognized.append(sym)
            # Fill the next empty slot with the symptom's severity weight
            if sym_clean in sym_weights and sym_clean in sym_list:
                idx = sym_list.index(sym_clean)
                feature_vector[idx] = sym_weights[sym_clean]
        else:
            unrecognized.append(sym)

    return feature_vector, recognized, unrecognized


# ROUTES

@app.get("/")
def root():
    """Health check — confirms the API is running"""
    return {
        "status"  : "HealTrack ML Service is running",
        "version" : "1.0.0",
        "endpoints": [
            "GET  /          — health check",
            "GET  /symptoms  — list of all valid symptom names",
            "GET  /diseases  — list of all 41 supported diseases",
            "POST /predict   — submit symptoms, get disease predictions"
        ]
    }


@app.get("/symptoms")
def get_symptoms():
    """
    Returns the full list of valid symptom names.
    Full-stack team uses this to populate the symptom dropdown/checklist
    on the patient input form — so patients only select valid symptoms.
    """
    symptom_names = sorted(list(sym_weights.keys()))
    return {
        "total"    : len(symptom_names),
        "symptoms" : symptom_names
    }


@app.get("/diseases")
def get_diseases():
    """
    Returns all 41 disease names the model can predict.
    Useful for the doctor-side dashboard and admin views.
    """
    diseases = sorted(list(encoder.classes_))
    return {
        "total"    : len(diseases),
        "diseases" : diseases
    }


@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest):
    """
    Main prediction endpoint.

    Receives patient symptoms,
    runs the Random Forest model,
    returns top 3 predicted diseases with full details.

        POST http://localhost:8000/predict
        Content-Type: application/json
        Body: { "symptoms": [...] }
    """

    # Validate input 
    if not request.symptoms:
        raise HTTPException(
            status_code=400,
            detail="No symptoms provided. Please select at least one symptom."
        )

    if len(request.symptoms) > 17:
        raise HTTPException(
            status_code=400,
            detail="Too many symptoms. Maximum allowed is 17."
        )

    # Build feature vector 
    feature_vector, recognized, unrecognized = build_feature_vector(request.symptoms)

    '''
    Check if any symptoms were actually recognised
    If all zeros, the model will just guess randomly
    '''
    if not recognized:
        raise HTTPException(
            status_code=400,
            detail=(
                "None of the provided symptoms were recognised: "
                f"{unrecognized}. Please use valid symptom names from "
                "GET /symptoms"
            )
        )

    # Run prediction 
    # predict_proba returns probability for all 41 diseases
    proba       = model.predict_proba([feature_vector])[0]

    # Sort by probability descending, take top 3
    top_indices = np.argsort(proba)[::-1][:3]

    # Build response 
    predictions = []
    for rank, idx in enumerate(top_indices):
        disease    = encoder.classes_[idx]
        confidence = round(float(proba[idx]) * 100, 2)

        predictions.append(SinglePrediction(
            rank        = rank + 1,
            disease     = disease,
            confidence  = confidence,
            risk_tier   = get_risk_tier(disease, confidence),
            description = desc_lookup.get(disease, "Description not available."),
            precautions = prec_lookup.get(disease, [])
        ))

    return PredictResponse(
        success               = True,
        input_symptoms        = request.symptoms,
        unrecognized_symptoms = unrecognized,
        predictions           = predictions
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
# app/services/parkinsons_prediction.py
import os
import urllib.request
import pandas as pd
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import logging

logger = logging.getLogger(__name__)

DATASET_URL = "https://archive.ics.uci.edu/ml/machine-learning-databases/parkinsons/parkinsons.data"
DATASET_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "datasets", "parkinsons.data")

# Global variables for model and scaler
model = None
scaler = None
feature_cols = []
df = None

def init_model():
    global model, scaler, feature_cols, df
    try:
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(DATASET_PATH), exist_ok=True)
        
        # Download dataset if not present
        if not os.path.exists(DATASET_PATH):
            logger.info("Downloading Parkinson's dataset from UCI...")
            urllib.request.urlretrieve(DATASET_URL, DATASET_PATH)
            logger.info("Download complete.")
            
        df = pd.read_csv(DATASET_PATH)
        feature_cols = [col for col in df.columns if col not in ['name', 'status']]
        
        X = df[feature_cols].values
        y = df['status'].values
        
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)
        
        model = SVC(kernel='rbf', C=10, gamma=0.1, probability=True)
        model.fit(X_train, y_train)
        
        accuracy = accuracy_score(y_test, model.predict(X_test))
        logger.info(f"SVM Model trained — Test Accuracy: {accuracy*100:.1f}%")
    except Exception as e:
        logger.error(f"Failed to initialize Parkinson's prediction model: {e}", exc_info=True)

def get_model_and_scaler():
    global model, scaler, feature_cols, df
    if model is None or scaler is None:
        init_model()
    if model is None or scaler is None:
        raise RuntimeError("Parkinson's prediction model is not initialized.")
    return model, scaler, feature_cols, df

def predict_parkinsons_full(data: dict) -> dict:
    model_svm, scaler_svm, f_cols, _ = get_model_and_scaler()
    features = [data.get(col, 0.0) for col in f_cols]
    features_scaled = scaler_svm.transform([features])
    prediction = model_svm.predict(features_scaled)[0]
    probability = model_svm.predict_proba(features_scaled)[0]

    risk_percent = int(probability[1] * 100)  # probability of Parkinson's
    label = "High Risk" if risk_percent >= 60 else "Moderate Risk" if risk_percent >= 30 else "Low Risk"

    return {
        "status": "ok",
        "prediction": int(prediction),  # 1 = Parkinson's, 0 = Healthy
        "riskPercent": risk_percent,
        "riskLabel": label,
        "confidence": f"{max(probability)*100:.1f}%"
    }

def predict_from_tests(data: dict) -> dict:
    model_svm, scaler_svm, f_cols, data_df = get_model_and_scaler()
    
    tremor_var = float(data.get("tremorVariance", 0))
    tap_count = int(data.get("tapCount", 0))
    tap_interval = float(data.get("tapAvgIntervalMs", 1000))
    tap_variability = float(data.get("tapVariabilityMs", 0))
    voice_match = float(data.get("voiceMatchPercent", 100))

    # Map sensor data to approximate voice feature space
    jitter_approx = min(tremor_var * 0.005, 0.05)           # MDVP:Jitter(%)
    shimmer_approx = max(0.01, (1.0 - tap_count / 50) * 0.1)   # MDVP:Shimmer
    nhr_approx = min(tap_variability / 8000, 0.4)           # NHR
    hnr_approx = voice_match / 100 * 28                     # HNR (0–30 range)
    rpde_approx = min(tap_interval / 2500, 1.0) * 0.5 + 0.2   # RPDE (0.2–0.8)
    dfa_approx = 0.5 + (1.0 - tap_count / 50) * 0.2           # DFA

    # Build base feature vector from healthy dataset means
    healthy_means = data_df[data_df['status'] == 0][f_cols].mean().values
    feature_vector = list(healthy_means)
    feature_index = {col: i for i, col in enumerate(f_cols)}

    overrides = {
        "MDVP:Jitter(%)":    jitter_approx,
        "MDVP:Jitter(Abs)":  jitter_approx / 100,
        "MDVP:RAP":          jitter_approx * 0.5,
        "MDVP:PPQ":          jitter_approx * 0.5,
        "Jitter:DDP":        jitter_approx * 1.5,
        "MDVP:Shimmer":      shimmer_approx,
        "MDVP:Shimmer(dB)":  shimmer_approx * 8,
        "Shimmer:APQ3":      shimmer_approx * 0.6,
        "Shimmer:APQ5":      shimmer_approx * 0.7,
        "MDVP:APQ":          shimmer_approx * 0.9,
        "Shimmer:DDA":       shimmer_approx * 1.8,
        "NHR":               nhr_approx,
        "HNR":               hnr_approx,
        "RPDE":              rpde_approx,
        "DFA":               dfa_approx,
    }

    for feat_name, value in overrides.items():
        if feat_name in feature_index:
            feature_vector[feature_index[feat_name]] = value

    features_scaled = scaler_svm.transform([feature_vector])
    prediction = model_svm.predict(features_scaled)[0]
    probability = model_svm.predict_proba(features_scaled)[0]
    risk_percent_ml = int(probability[1] * 100)

    # Compute rule-based composite score
    rule_score = 0
    if tremor_var > 3.5: rule_score += 30
    elif tremor_var > 2.0: rule_score += 15
    elif tremor_var > 1.0: rule_score += 5
    
    if tap_count < 8: rule_score += 30
    elif tap_count < 15: rule_score += 10
    
    if tap_variability > 600: rule_score += 10
    
    if voice_match < 40: rule_score += 20
    elif voice_match < 60: rule_score += 10
    
    rule_score = min(rule_score, 100)

    final_score = int((risk_percent_ml * 0.8) + (rule_score * 0.2))
    label = "High Risk" if final_score >= 65 else "Moderate Risk" if final_score >= 35 else "Low Risk"

    return {
        "status": "ok",
        "prediction": int(prediction),
        "riskPercent": final_score,
        "riskLabel": label,
        "mlScore": risk_percent_ml,
        "ruleScore": rule_score,
        "confidence": f"{max(probability)*100:.1f}%",
        "breakdown": {
            "tremorVariance": tremor_var,
            "tapCount": tap_count,
            "tapInterval": tap_interval,
            "voiceMatch": voice_match
        }
    }

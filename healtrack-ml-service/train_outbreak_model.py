import os
import numpy as np
import joblib
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier

# Determine directories
BASE_DIR = Path(__file__).resolve().parent
TRAINED_MODELS_DIR = BASE_DIR / "trained_models"
os.makedirs(TRAINED_MODELS_DIR, exist_ok=True)

def train_and_save_model():
    print("Generating synthetic outbreak data...")
    # Seed for reproducibility
    np.random.seed(42)
    
    # Generate synthetic features:
    # 1. recent_cases_count (0 to 100)
    # 2. growth_rate (0.5 to 3.0)
    # 3. season_index (1 to 4: Spring, Summer, Autumn, Winter)
    # 4. population_density_score (1 to 10)
    num_samples = 1000
    
    X = np.zeros((num_samples, 4))
    X[:, 0] = np.random.randint(0, 100, num_samples)             # recent_cases_count
    X[:, 1] = np.random.uniform(0.5, 3.0, num_samples)           # growth_rate
    X[:, 2] = np.random.randint(1, 5, num_samples)               # season_index
    X[:, 3] = np.random.randint(1, 11, num_samples)              # population_density_score
    
    # Define target outbreak risk:
    # High risk (2) if recent cases > 50 and growth_rate > 1.8 and density > 5
    # Medium risk (1) if recent cases > 20 and growth_rate > 1.2
    # Low risk (0) otherwise
    y = np.zeros(num_samples)
    for i in range(num_samples):
        recent = X[i, 0]
        growth = X[i, 1]
        density = X[i, 3]
        
        if recent > 50 and growth > 1.8 and density > 5:
            y[i] = 2  # High Risk
        elif recent > 20 and growth > 1.2:
            y[i] = 1  # Medium Risk
        else:
            y[i] = 0  # Low Risk
            
    print(f"Dataset generated. Target counts: Low={np.sum(y==0)}, Medium={np.sum(y==1)}, High={np.sum(y==2)}")
    
    # Train Random Forest Classifier
    print("Training Random Forest Classifier...")
    model = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
    model.fit(X, y)
    
    model_path = TRAINED_MODELS_DIR / "outbreak_model.pkl"
    print(f"Saving model to {model_path}...")
    joblib.dump(model, model_path)
    print("Outbreak prediction model successfully trained and saved!")

if __name__ == "__main__":
    train_and_save_model()

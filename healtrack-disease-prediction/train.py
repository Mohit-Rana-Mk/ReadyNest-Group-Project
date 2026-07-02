import pandas as pd
import numpy as np
import joblib
import warnings
import os
 
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score, f1_score
)
 
warnings.filterwarnings("ignore")

BASE = os.path.dirname(os.path.abspath(__file__))

# Loading the Data
df   = pd.read_csv(os.path.join(BASE, "datasets/dataset.csv"))
sev  = pd.read_csv(os.path.join(BASE, "datasets/Symptom-severity.csv"))
desc = pd.read_csv(os.path.join(BASE, "datasets/symptom_Description.csv"))
prec = pd.read_csv(os.path.join(BASE, "datasets/symptom_precaution.csv"))
print("Completed Loading Dataset!!!")

# Cleaning the dataset

cols = df.columns
data = df[cols].values.flatten()
s = pd.Series(data)
s = s.str.strip()
sev['Symptom'] = sev['Symptom'].str.strip()
sev['weight']  = pd.to_numeric(sev['weight'])
data  = s.values.reshape(df.shape)
df = pd.DataFrame(data, columns=cols)


df = df.replace('dischromic _patches', 'dischromic_patches')
df = df.replace('spotting_ urination', 'spotting_urination')
df = df.replace('foul_smell_of urine', 'foul_smell_ofurine')

df = df.fillna(0)
print("Completed Cleaning Dataset!!!")

'''
Whitespace stripped from all cells
3 broken symptom strings fixed
NaN values filled with 0
'''

# Severity weight encoding

vals = df.values.copy()
symptoms = sev['Symptom'].values
weights  = sev['weight'].values

'''
Weight scale: 1 (very mild) → 7 (very severe) -> severity weight encoding
'''

for i in range(len(symptoms)):
    match_mask = (vals == symptoms[i])
    if not match_mask.any():
        print(f"WARNING: symptom '{symptoms[i]}' in Symptom-severity.csv "
              f"never matched any value in dataset.csv — check for a "
              f"spelling/formatting mismatch (it will be encoded as 0).")
    vals[match_mask] = weights[i]

df_encoded = pd.DataFrame(vals, columns=cols)

symptom_cols = cols[1:]
for c in symptom_cols:
    df_encoded[c] = pd.to_numeric(df_encoded[c], errors='coerce').fillna(0)


'''
Symptom names replaced with severity weights
Weight scale: 1 (very mild) → 7 (very severe)
'''

# Preparing features and labels

X = df_encoded[symptom_cols].values.astype(float)
y_raw = df_encoded['Disease'].values

le = LabelEncoder()
y  = le.fit_transform(y_raw)

symptom_list = list(symptom_cols)

# Training and Testing

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

model = RandomForestClassifier(
    n_estimators=200,
    max_depth=None,
    min_samples_split=2,
    random_state=42,
    n_jobs=-1
)

model.fit(X_train, y_train)
preds = model.predict(X_test)

print("Completed Model Training!!!")

# Evaluation

accuracy = accuracy_score(y_test, preds) * 100
f1 = f1_score(y_test, preds, average='macro') * 100
cv_scores = cross_val_score(model, X, y, cv=5, scoring='accuracy', n_jobs=-1)

print("Model Accuracy Results")
print(f"Accuracy        : {accuracy:.2f}%")
print(f"F1-Score (macro): {f1:.2f}%")
print(f"CV Accuracy     : {cv_scores.mean()*100:.2f}% ± {cv_scores.std()*100:.2f}%")

# Building recommendation lookup tables

desc_lookup = dict(zip(
    desc['Disease'].str.strip(),
    desc['Description'].str.strip()
))

prec['Disease'] = prec['Disease'].str.strip()
prec_lookup = {}
for _, row in prec.iterrows():
    disease = row['Disease']
    precautions = [
        str(row['Precaution_1']).strip(),
        str(row['Precaution_2']).strip(),
        str(row['Precaution_3']).strip(),
        str(row['Precaution_4']).strip(),
    ]
    
    precautions = [p for p in precautions if p.lower() != 'nan']
    prec_lookup[disease] = precautions

'''
Description lookup: disease -> plain text description
Precaution lookup: disease -> list of up to 4 precautions
'''

'''
Risk tier mapping
In risk_tiers.py — shared by train.py and app.py
get_risk_tier() isn't called during training; it's just re-exported here so
any future training-time reporting can use the exact same mapping
the API uses at inference time.
'''

from risk_tiers import get_risk_tier, HIGH_SEVERITY_DISEASES, MODERATE_SEVERITY_DISEASES

# Saving model artifacts

ARTIFACTS_DIR = os.path.join(BASE, "model_artifacts")
os.makedirs(ARTIFACTS_DIR, exist_ok=True)
joblib.dump(model, os.path.join(ARTIFACTS_DIR, "disease_model.pkl"))
joblib.dump(le, os.path.join(ARTIFACTS_DIR, "label_encoder.pkl"))
joblib.dump(dict(zip(sev['Symptom'], sev['weight'])),
            os.path.join(ARTIFACTS_DIR, "symptom_weights.pkl"))
joblib.dump(symptom_list, os.path.join(ARTIFACTS_DIR, "symptom_list.pkl"))
joblib.dump(desc_lookup, os.path.join(ARTIFACTS_DIR, "disease_descriptions.pkl"))
joblib.dump(prec_lookup, os.path.join(ARTIFACTS_DIR, "disease_precautions.pkl"))

print("All artifacts saved to model_artifacts/")
print("Training complete. Next: run python app.py")
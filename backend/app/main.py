import os
import sys
import warnings
import joblib
import pandas as pd
import numpy as np

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Try importing dill for deserializing VQC model
try:
    import dill
except ImportError:
    dill = None

# Qiskit imports for fallback VQC reconstruction if needed
from qiskit.circuit.library import zz_feature_map, real_amplitudes
from qiskit.primitives import StatevectorSampler
from qiskit_machine_learning.algorithms import VQC
from qiskit_machine_learning.optimizers import COBYLA

warnings.filterwarnings("ignore")

# Define base paths relative to backend directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")

# Global variables for pre-loaded model artifacts
scaler = None
lr_model = None
svm_model = None
feature_selector_data = None
quantum_selector = None
selected_feature_names = ["thalach", "exang", "ca", "thal"]
vqc_model = None


def load_all_artifacts():
    """Load all saved scaler and model artifacts from backend/models/."""
    global scaler, lr_model, svm_model, feature_selector_data, quantum_selector, selected_feature_names, vqc_model

    scaler_path = os.path.join(MODELS_DIR, "scaler.pkl")
    lr_path = os.path.join(MODELS_DIR, "logistic_regression.pkl")
    svm_path = os.path.join(MODELS_DIR, "svm.pkl")
    selector_path = os.path.join(MODELS_DIR, "quantum_feature_selector.pkl")
    vqc_weights_path = os.path.join(MODELS_DIR, "vqc_weights.pkl")
    vqc_model_path = os.path.join(MODELS_DIR, "vqc_model.pkl")

    # 1. Load Scaler
    if os.path.exists(scaler_path):
        scaler = joblib.load(scaler_path)
    else:
        raise FileNotFoundError(f"Scaler file missing at {scaler_path}")

    # 2. Load Logistic Regression
    if os.path.exists(lr_path):
        lr_model = joblib.load(lr_path)
    else:
        raise FileNotFoundError(f"Logistic Regression model file missing at {lr_path}")

    # 3. Load SVM
    if os.path.exists(svm_path):
        svm_model = joblib.load(svm_path)
    else:
        raise FileNotFoundError(f"SVM model file missing at {svm_path}")

    # 4. Load Quantum Feature Selector
    if os.path.exists(selector_path):
        feature_selector_data = joblib.load(selector_path)
        quantum_selector = feature_selector_data["selector"]
        selected_feature_names = feature_selector_data.get("feature_names", ["thalach", "exang", "ca", "thal"])
    else:
        raise FileNotFoundError(f"Quantum feature selector file missing at {selector_path}")

    # 5. Load VQC Model
    if os.path.exists(vqc_model_path) and dill is not None:
        try:
            with open(vqc_model_path, "rb") as f:
                vqc_model = dill.load(f)
        except Exception:
            vqc_model = None

    if vqc_model is None and os.path.exists(vqc_weights_path):
        # Reconstruct VQC with saved weights as fallback
        weights_dict = joblib.load(vqc_weights_path)
        fmap = zz_feature_map(feature_dimension=4, reps=2, entanglement="linear")
        ansatz = real_amplitudes(num_qubits=4, reps=2, entanglement="linear")
        vqc_model = VQC(
            feature_map=fmap,
            ansatz=ansatz,
            optimizer=COBYLA(maxiter=50),
            sampler=StatevectorSampler()
        )
        # Fit dummy to initialize structure, then override weights
        vqc_model.fit(np.zeros((2, 4)), np.array([0, 1]))
        vqc_model.weights = weights_dict["weights"]


# Initialize FastAPI application
app = FastAPI(
    title="Hybrid QML Disease Detection API",
    description="FastAPI Backend for Hybrid Quantum-Classical Heart Disease Detection",
    version="1.0.0"
)

# Load model artifacts at application startup
load_all_artifacts()

# Configure CORS for local frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic Schema for 13 Patient Clinical Features
class PatientData(BaseModel):
    age: float = Field(..., example=63.0, description="Age in years")
    sex: float = Field(..., example=1.0, description="Sex (1 = male, 0 = female)")
    cp: float = Field(..., example=1.0, description="Chest pain type (1, 2, 3, 4)")
    trestbps: float = Field(..., example=145.0, description="Resting blood pressure in mm Hg")
    chol: float = Field(..., example=233.0, description="Serum cholestoral in mg/dl")
    fbs: float = Field(..., example=1.0, description="Fasting blood sugar > 120 mg/dl (1 = true, 0 = false)")
    restecg: float = Field(..., example=2.0, description="Resting electrocardiographic results (0, 1, 2)")
    thalach: float = Field(..., example=150.0, description="Maximum heart rate achieved")
    exang: float = Field(..., example=0.0, description="Exercise induced angina (1 = yes, 0 = no)")
    oldpeak: float = Field(..., example=2.3, description="ST depression induced by exercise relative to rest")
    slope: float = Field(..., example=3.0, description="Slope of the peak exercise ST segment")
    ca: float = Field(..., example=0.0, description="Number of major vessels (0-3) colored by fluoroscopy")
    thal: float = Field(..., example=6.0, description="Thalassemia (3 = normal, 6 = fixed defect, 7 = reversible defect)")


def prepare_input_features(patient: PatientData):
    """
    Transforms Pydantic PatientData into:
    1. 13-feature DataFrame
    2. Scaled 13-feature array
    3. 4-feature quantum-ready array
    """
    feature_dict = {
        "age": patient.age,
        "sex": patient.sex,
        "cp": patient.cp,
        "trestbps": patient.trestbps,
        "chol": patient.chol,
        "fbs": patient.fbs,
        "restecg": patient.restecg,
        "thalach": patient.thalach,
        "exang": patient.exang,
        "oldpeak": patient.oldpeak,
        "slope": patient.slope,
        "ca": patient.ca,
        "thal": patient.thal
    }
    df = pd.DataFrame([feature_dict])
    scaled_features = scaler.transform(df)
    quantum_features = quantum_selector.transform(scaled_features)
    return scaled_features, quantum_features


@app.get("/")
def root():
    """API Root Endpoint."""
    return {
        "message": "Hybrid QML Disease Detection API is running",
        "status": "success"
    }


@app.get("/health")
def health_check():
    """Health check verifying model artifacts existence and readiness."""
    artifacts_ready = (
        scaler is not None and
        lr_model is not None and
        svm_model is not None and
        quantum_selector is not None and
        vqc_model is not None
    )

    if not artifacts_ready:
        raise HTTPException(
            status_code=500,
            detail="Health check failed: One or more model artifacts are not loaded."
        )

    return {
        "status": "healthy"
    }


@app.get("/model-info")
def get_model_info():
    """Returns architecture configuration and measured evaluation metrics."""
    return {
        "system_info": {
            "models": ["Logistic Regression", "Support Vector Machine (SVM)", "Variational Quantum Classifier (VQC)"],
            "vqc_qubits": 4,
            "selected_quantum_features": selected_feature_names,
            "feature_map": "ZZFeatureMap (reps=2, entanglement='linear')",
            "ansatz": "RealAmplitudes (reps=2, entanglement='linear')",
            "optimizer": "COBYLA (maxiter=50)",
            "simulator": "Qiskit StatevectorSampler (Local Simulator)"
        },
        "evaluation_metrics": {
            "logistic_regression": {
                "accuracy": 0.8689,
                "precision": 0.8125,
                "recall": 0.9286,
                "f1_score": 0.8667,
                "sensitivity": 0.9286,
                "specificity": 0.8182,
                "roc_auc": 0.9513
            },
            "svm": {
                "accuracy": 0.8525,
                "precision": 0.8065,
                "recall": 0.8929,
                "f1_score": 0.8475,
                "sensitivity": 0.8929,
                "specificity": 0.8182,
                "roc_auc": 0.9437
            },
            "vqc": {
                "accuracy": 0.5902,
                "precision": 0.5714,
                "recall": 0.4286,
                "f1_score": 0.4898,
                "sensitivity": 0.4286,
                "specificity": 0.7273,
                "roc_auc": 0.7213
            }
        }
    }


@app.post("/predict")
def predict_vqc_endpoint(patient: PatientData):
    """
    Accepts 13 patient features, applies scaling and 4-feature quantum selection,
    and returns the VQC risk assessment.
    """
    if vqc_model is None or scaler is None or quantum_selector is None:
        raise HTTPException(status_code=500, detail="VQC model artifacts are not loaded.")

    try:
        _, quantum_features = prepare_input_features(patient)

        # Get raw VQC prediction
        raw_pred = vqc_model.predict(quantum_features)
        pred_val = int(np.asarray(raw_pred).flat[0])

        # Get VQC decision score (probability of class 1)
        try:
            probas = vqc_model.predict_proba(quantum_features)
            decision_score = float(round(probas[0][1], 4))
        except Exception:
            decision_score = None

        label = "Elevated Risk" if pred_val == 1 else "Lower Risk"

        return {
            "model": "Variational Quantum Classifier (VQC)",
            "prediction": pred_val,
            "label": label,
            "status": "success",
            "decision_score": decision_score,
            "selected_quantum_features": selected_feature_names,
            "qubits": 4
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@app.post("/compare")
def compare_models_endpoint(patient: PatientData):
    """
    Runs patient data through Logistic Regression, SVM, and VQC models in parallel
    and returns individual model predictions and scores/probabilities.
    """
    if lr_model is None or svm_model is None or vqc_model is None:
        raise HTTPException(status_code=500, detail="One or more model artifacts are not loaded.")

    try:
        scaled_features, quantum_features = prepare_input_features(patient)

        # 1. Logistic Regression
        lr_pred = int(lr_model.predict(scaled_features)[0])
        lr_prob = float(round(lr_model.predict_proba(scaled_features)[0][1], 4))
        lr_label = "Elevated Risk" if lr_pred == 1 else "Lower Risk"

        # 2. Support Vector Machine (SVM)
        svm_pred = int(svm_model.predict(scaled_features)[0])
        svm_prob = float(round(svm_model.predict_proba(scaled_features)[0][1], 4))
        svm_label = "Elevated Risk" if svm_pred == 1 else "Lower Risk"

        # 3. Variational Quantum Classifier (VQC)
        raw_vqc_pred = vqc_model.predict(quantum_features)
        vqc_pred = int(np.asarray(raw_vqc_pred).flat[0])
        vqc_label = "Elevated Risk" if vqc_pred == 1 else "Lower Risk"

        try:
            vqc_probas = vqc_model.predict_proba(quantum_features)
            vqc_decision_score = float(round(vqc_probas[0][1], 4))
        except Exception:
            vqc_decision_score = None

        return {
            "logistic_regression": {
                "prediction": lr_pred,
                "label": lr_label,
                "probability": lr_prob
            },
            "svm": {
                "prediction": svm_pred,
                "label": svm_label,
                "probability": svm_prob
            },
            "vqc": {
                "prediction": vqc_pred,
                "label": vqc_label,
                "decision_score": vqc_decision_score
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8001, reload=True)

import os
import sys
import json
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

# Global variables for pre-loaded Heart Disease model artifacts
scaler = None
lr_model = None
svm_model = None
feature_selector_data = None
quantum_selector = None
selected_feature_names = ["thalach", "exang", "ca", "thal"]
vqc_model = None

# Global variables for Breast Cancer model artifacts
BC_MODELS_DIR = os.path.join(MODELS_DIR, "breast_cancer")
bc_scaler = None
bc_selector_data = None
bc_quantum_selector = None
bc_selected_feature_names = []
bc_vqc_model = None
bc_metadata = None

# Global variables for Lung Cancer model artifacts
LC_MODELS_DIR = os.path.join(MODELS_DIR, "lung_cancer")
lc_scaler = None
lc_selector_data = None
lc_quantum_selector = None
lc_selected_feature_names = []
lc_vqc_model = None
lc_metadata = None


def load_all_artifacts():
    """Load all saved scaler and model artifacts from backend/models/."""
    global scaler, lr_model, svm_model, feature_selector_data, quantum_selector, selected_feature_names, vqc_model
    global bc_scaler, bc_selector_data, bc_quantum_selector, bc_selected_feature_names, bc_vqc_model, bc_metadata
    global lc_scaler, lc_selector_data, lc_quantum_selector, lc_selected_feature_names, lc_vqc_model, lc_metadata

    # 1. Load Heart Disease artifacts
    scaler_path = os.path.join(MODELS_DIR, "scaler.pkl")
    lr_path = os.path.join(MODELS_DIR, "logistic_regression.pkl")
    svm_path = os.path.join(MODELS_DIR, "svm.pkl")
    selector_path = os.path.join(MODELS_DIR, "quantum_feature_selector.pkl")
    vqc_weights_path = os.path.join(MODELS_DIR, "vqc_weights.pkl")
    vqc_model_path = os.path.join(MODELS_DIR, "vqc_model.pkl")

    if os.path.exists(scaler_path):
        scaler = joblib.load(scaler_path)
    if os.path.exists(lr_path):
        lr_model = joblib.load(lr_path)
    if os.path.exists(svm_path):
        svm_model = joblib.load(svm_path)
    if os.path.exists(selector_path):
        feature_selector_data = joblib.load(selector_path)
        quantum_selector = feature_selector_data["selector"]
        selected_feature_names = feature_selector_data.get("feature_names", ["thalach", "exang", "ca", "thal"])

    if os.path.exists(vqc_model_path) and dill is not None:
        try:
            with open(vqc_model_path, "rb") as f:
                vqc_model = dill.load(f)
        except Exception:
            vqc_model = None

    if vqc_model is None and os.path.exists(vqc_weights_path):
        weights_dict = joblib.load(vqc_weights_path)
        fmap = zz_feature_map(feature_dimension=4, reps=2, entanglement="linear")
        ansatz = real_amplitudes(num_qubits=4, reps=2, entanglement="linear")
        vqc_model = VQC(
            feature_map=fmap,
            ansatz=ansatz,
            optimizer=COBYLA(maxiter=50),
            sampler=StatevectorSampler()
        )
        vqc_model.fit(np.zeros((2, 4)), np.array([0, 1]))
        vqc_model.weights = weights_dict["weights"]

    # 2. Load Breast Cancer artifacts
    if os.path.exists(BC_MODELS_DIR):
        try:
            bc_scaler = joblib.load(os.path.join(BC_MODELS_DIR, "scaler.pkl"))
            bc_selector_data = joblib.load(os.path.join(BC_MODELS_DIR, "selector.pkl"))
            bc_quantum_selector = bc_selector_data["selector"]
            bc_selected_feature_names = bc_selector_data.get("feature_names", [])

            meta_path = os.path.join(BC_MODELS_DIR, "metadata.json")
            if os.path.exists(meta_path):
                with open(meta_path, "r") as f:
                    bc_metadata = json.load(f)

            bc_vqc_path = os.path.join(BC_MODELS_DIR, "vqc_model.pkl")
            if os.path.exists(bc_vqc_path) and dill is not None:
                try:
                    with open(bc_vqc_path, "rb") as f:
                        bc_vqc_model = dill.load(f)
                except Exception:
                    bc_vqc_model = None

            if bc_vqc_model is None and os.path.exists(os.path.join(BC_MODELS_DIR, "vqc_weights.pkl")):
                weights_dict = joblib.load(os.path.join(BC_MODELS_DIR, "vqc_weights.pkl"))
                fmap = zz_feature_map(feature_dimension=4, reps=2, entanglement="linear")
                ansatz = real_amplitudes(num_qubits=4, reps=2, entanglement="linear")
                bc_vqc_model = VQC(feature_map=fmap, ansatz=ansatz, optimizer=COBYLA(maxiter=50), sampler=StatevectorSampler())
                bc_vqc_model.fit(np.zeros((2, 4)), np.array([0, 1]))
                bc_vqc_model.weights = weights_dict["weights"]
        except Exception as e:
            print(f"Warning loading Breast Cancer artifacts: {e}")

    # 3. Load Lung Cancer artifacts
    if os.path.exists(LC_MODELS_DIR):
        try:
            lc_scaler = joblib.load(os.path.join(LC_MODELS_DIR, "scaler.pkl"))
            lc_selector_data = joblib.load(os.path.join(LC_MODELS_DIR, "selector.pkl"))
            lc_quantum_selector = lc_selector_data["selector"]
            lc_selected_feature_names = lc_selector_data.get("feature_names", [])

            meta_path = os.path.join(LC_MODELS_DIR, "metadata.json")
            if os.path.exists(meta_path):
                with open(meta_path, "r") as f:
                    lc_metadata = json.load(f)

            lc_vqc_path = os.path.join(LC_MODELS_DIR, "vqc_model.pkl")
            if os.path.exists(lc_vqc_path) and dill is not None:
                try:
                    with open(lc_vqc_path, "rb") as f:
                        lc_vqc_model = dill.load(f)
                except Exception:
                    lc_vqc_model = None

            if lc_vqc_model is None and os.path.exists(os.path.join(LC_MODELS_DIR, "vqc_weights.pkl")):
                weights_dict = joblib.load(os.path.join(LC_MODELS_DIR, "vqc_weights.pkl"))
                fmap = zz_feature_map(feature_dimension=4, reps=2, entanglement="linear")
                ansatz = real_amplitudes(num_qubits=4, reps=2, entanglement="linear")
                lc_vqc_model = VQC(feature_map=fmap, ansatz=ansatz, optimizer=COBYLA(maxiter=50), sampler=StatevectorSampler())
                lc_vqc_model.fit(np.zeros((2, 4)), np.array([0, 1]))
                lc_vqc_model.weights = weights_dict["weights"]
        except Exception as e:
            print(f"Warning loading Lung Cancer artifacts: {e}")


# Initialize FastAPI application
app = FastAPI(
    title="Hybrid QML Disease Detection API",
    description="FastAPI Backend for Hybrid Quantum Machine Learning Disease Detection",
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


# Pydantic Schema for Heart Disease Patient Clinical Features
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
    return {
        "message": "Hybrid QML Disease Detection API is running",
        "status": "success",
        "diseases_supported": ["Heart Disease", "Breast Cancer", "Lung Cancer"]
    }


@app.get("/health")
def health_check():
    artifacts_ready = (
        scaler is not None and
        vqc_model is not None and
        bc_vqc_model is not None and
        lc_vqc_model is not None
    )

    return {
        "status": "healthy" if artifacts_ready else "degraded",
        "heart_disease_ready": vqc_model is not None,
        "breast_cancer_ready": bc_vqc_model is not None,
        "lung_cancer_ready": lc_vqc_model is not None
    }


@app.get("/model-info")
def get_model_info():
    return {
        "system_info": {
            "supported_diseases": ["Heart Disease", "Breast Cancer", "Lung Cancer"],
            "vqc_qubits": 4,
            "feature_map": "ZZFeatureMap (reps=2, entanglement='linear')",
            "ansatz": "RealAmplitudes (reps=2, entanglement='linear')",
            "optimizer": "COBYLA (maxiter=50)",
            "simulator": "Qiskit StatevectorSampler (Local Simulator)"
        },
        "diseases": {
            "heart_disease": {
                "features": 13,
                "selected_quantum_features": selected_feature_names
            },
            "breast_cancer": {
                "features": bc_metadata.get("feature_count", 30) if bc_metadata else 30,
                "selected_quantum_features": bc_selected_feature_names
            },
            "lung_cancer": {
                "features": lc_metadata.get("feature_count", 15) if lc_metadata else 15,
                "selected_quantum_features": lc_selected_feature_names
            }
        }
    }


@app.get("/metadata/breast-cancer")
def get_breast_cancer_metadata():
    if bc_metadata is None:
        raise HTTPException(status_code=404, detail="Breast Cancer metadata not found.")
    return bc_metadata


@app.get("/metadata/lung-cancer")
def get_lung_cancer_metadata():
    if lc_metadata is None:
        raise HTTPException(status_code=404, detail="Lung Cancer metadata not found.")
    return lc_metadata


@app.post("/predict")
def predict_vqc_endpoint(payload: dict):
    """
    Unified prediction endpoint supporting disease routing.
    Default: Heart Disease if 13 Heart features provided.
    """
    disease = payload.get("disease", "").lower()

    if "breast" in disease:
        return predict_breast_cancer(payload)
    elif "lung" in disease:
        return predict_lung_cancer(payload)
    else:
        # Default Heart Disease prediction
        try:
            patient = PatientData(**payload)
            return predict_heart_disease_vqc(patient)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid Heart Disease payload: {str(e)}")


@app.post("/predict/heart")
def predict_heart_disease_vqc(patient: PatientData):
    if vqc_model is None or scaler is None or quantum_selector is None:
        raise HTTPException(status_code=500, detail="Heart Disease VQC model artifacts are not loaded.")

    try:
        _, quantum_features = prepare_input_features(patient)
        raw_pred = vqc_model.predict(quantum_features)
        pred_val = int(np.asarray(raw_pred).flat[0])

        try:
            probas = vqc_model.predict_proba(quantum_features)
            decision_score = float(round(probas[0][1], 4))
        except Exception:
            decision_score = None

        label = "Elevated Risk" if pred_val == 1 else "Lower Risk"

        return {
            "disease": "Heart Disease",
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


@app.post("/predict/breast-cancer")
@app.post("/predict/breast_cancer")
def predict_breast_cancer(payload: dict):
    if bc_vqc_model is None or bc_scaler is None or bc_quantum_selector is None:
        raise HTTPException(status_code=500, detail="Breast Cancer VQC model artifacts are not loaded.")

    try:
        all_features = bc_metadata.get("all_feature_names", []) if bc_metadata else []
        medians = bc_metadata.get("feature_medians", {}) if bc_metadata else {}

        row = {}
        for feature in all_features:
            if feature in payload:
                row[feature] = float(payload[feature])
            elif feature in medians:
                row[feature] = float(medians[feature])
            else:
                row[feature] = 0.0

        df = pd.DataFrame([row])
        scaled = bc_scaler.transform(df)
        q_features = bc_quantum_selector.transform(scaled)

        raw_pred = bc_vqc_model.predict(q_features)
        pred_val = int(np.asarray(raw_pred).flat[0])

        try:
            probas = bc_vqc_model.predict_proba(q_features)
            decision_score = float(round(probas[0][1], 4))
        except Exception:
            decision_score = None

        label = "Elevated Risk (Malignant)" if pred_val == 1 else "Lower Risk (Benign)"

        return {
            "disease": "Breast Cancer",
            "model": "Variational Quantum Classifier (VQC)",
            "prediction": pred_val,
            "label": label,
            "status": "success",
            "decision_score": decision_score,
            "selected_quantum_features": bc_selected_feature_names,
            "qubits": 4
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Breast Cancer prediction error: {str(e)}")


@app.post("/predict/lung-cancer")
@app.post("/predict/lung_cancer")
def predict_lung_cancer(payload: dict):
    if lc_vqc_model is None or lc_scaler is None or lc_quantum_selector is None:
        raise HTTPException(status_code=500, detail="Lung Cancer VQC model artifacts are not loaded.")

    try:
        all_features = lc_metadata.get("all_feature_names", []) if lc_metadata else []
        medians = lc_metadata.get("feature_medians", {}) if lc_metadata else {}

        row = {}
        for feature in all_features:
            if feature in payload:
                row[feature] = float(payload[feature])
            elif feature in medians:
                row[feature] = float(medians[feature])
            else:
                row[feature] = 0.0

        df = pd.DataFrame([row])
        scaled = lc_scaler.transform(df)
        q_features = lc_quantum_selector.transform(scaled)

        raw_pred = lc_vqc_model.predict(q_features)
        pred_val = int(np.asarray(raw_pred).flat[0])

        try:
            probas = lc_vqc_model.predict_proba(q_features)
            decision_score = float(round(probas[0][1], 4))
        except Exception:
            decision_score = None

        label = "Elevated Risk (Lung Cancer Positive)" if pred_val == 1 else "Lower Risk (Lung Cancer Negative)"

        return {
            "disease": "Lung Cancer",
            "model": "Variational Quantum Classifier (VQC)",
            "prediction": pred_val,
            "label": label,
            "status": "success",
            "decision_score": decision_score,
            "selected_quantum_features": lc_selected_feature_names,
            "qubits": 4
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lung Cancer prediction error: {str(e)}")


@app.post("/compare")
def compare_models_endpoint(patient: PatientData):
    """Preserved classical-vs-quantum comparison endpoint for Heart Disease."""
    if lr_model is None or svm_model is None or vqc_model is None:
        raise HTTPException(status_code=500, detail="One or more model artifacts are not loaded.")

    try:
        scaled_features, quantum_features = prepare_input_features(patient)

        lr_pred = int(lr_model.predict(scaled_features)[0])
        lr_prob = float(round(lr_model.predict_proba(scaled_features)[0][1], 4))
        lr_label = "Elevated Risk" if lr_pred == 1 else "Lower Risk"

        svm_pred = int(svm_model.predict(scaled_features)[0])
        svm_prob = float(round(svm_model.predict_proba(scaled_features)[0][1], 4))
        svm_label = "Elevated Risk" if svm_pred == 1 else "Lower Risk"

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

import os
import sys
import time
import warnings
import joblib
import numpy as np
import pandas as pd
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix
)

# Qiskit 2.5.2 & Qiskit Machine Learning 0.9.1 imports
from qiskit.circuit.library import zz_feature_map, real_amplitudes
from qiskit.primitives import StatevectorSampler
from qiskit_machine_learning.algorithms import VQC
from qiskit_machine_learning.optimizers import COBYLA

# Try importing dill for full object serialization safety
try:
    import dill
except ImportError:
    dill = None

# Suppress future/user warnings for clean terminal output
warnings.filterwarnings("ignore")

# Ensure backend directory is in sys.path for direct script execution
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app.preprocessing import get_train_test_data

# Standard feature names in Cleveland Heart Disease dataset
FEATURE_NAMES = [
    "age", "sex", "cp", "trestbps", "chol", "fbs",
    "restecg", "thalach", "exang", "oldpeak", "slope", "ca", "thal"
]


def select_quantum_features(X_train, y_train, X_test, n_features=4):
    """
    Selects top n_features from X_train using ANOVA F-value (SelectKBest).
    Fitted ONLY on training data to prevent data leakage.
    
    Returns:
        X_train_q, X_test_q, selector, selected_feature_names
    """
    selector = SelectKBest(score_func=f_classif, k=n_features)
    X_train_q = selector.fit_transform(X_train, y_train)
    X_test_q = selector.transform(X_test)

    # Get selected feature names
    selected_indices = selector.get_support(indices=True)
    selected_feature_names = [FEATURE_NAMES[i] for i in selected_indices]

    # Save feature selector artifact
    models_dir = os.path.join(BASE_DIR, "models")
    os.makedirs(models_dir, exist_ok=True)
    joblib.dump(
        {"selector": selector, "feature_names": selected_feature_names, "indices": selected_indices},
        os.path.join(models_dir, "quantum_feature_selector.pkl")
    )

    return X_train_q, X_test_q, selector, selected_feature_names


def build_vqc(num_qubits=4, maxiter=50):
    """
    Builds the Variational Quantum Classifier (VQC) using Qiskit 2.5.2 & Qiskit ML 0.9.1.
    
    Components:
    - Feature Map: ZZFeatureMap (2 repetitions, linear entanglement)
    - Ansatz: RealAmplitudes (2 repetitions, linear entanglement)
    - Optimizer: COBYLA (maxiter iterations)
    - Sampler Primitive: StatevectorSampler
    """
    # 1. Quantum Feature Map (maps 4 classical features to 4 qubits)
    feature_map_circuit = zz_feature_map(
        feature_dimension=num_qubits,
        reps=2,
        entanglement="linear"
    )

    # 2. Variational Quantum Ansatz (trainable quantum circuit parameters)
    ansatz_circuit = real_amplitudes(
        num_qubits=num_qubits,
        reps=2,
        entanglement="linear"
    )

    # 3. Classical Optimizer
    optimizer = COBYLA(maxiter=maxiter)

    # 4. Statevector Sampler (local simulator backend)
    sampler = StatevectorSampler()

    # 5. Training Progress Callback
    step = 0
    def callback(weights, loss_val):
        nonlocal step
        step += 1
        if step % 5 == 0 or step == 1:
            print(f"  Iteration {step:3d} | Optimization Loss: {loss_val:.4f}", flush=True)

    # 6. Instantiate VQC classifier
    vqc = VQC(
        feature_map=feature_map_circuit,
        ansatz=ansatz_circuit,
        optimizer=optimizer,
        callback=callback,
        sampler=sampler
    )

    return vqc, feature_map_circuit, ansatz_circuit, optimizer, sampler


def train_vqc(vqc, X_train_q, y_train):
    """
    Trains the VQC model on quantum features and saves model artifacts.
    """
    # Convert y_train to numpy array if pandas Series
    y_train_np = y_train.to_numpy() if hasattr(y_train, "to_numpy") else np.array(y_train)

    # Fit VQC model
    vqc.fit(X_train_q, y_train_np)

    # Save trained VQC model and parameters to backend/models/
    models_dir = os.path.join(BASE_DIR, "models")
    os.makedirs(models_dir, exist_ok=True)

    # Save weights dictionary
    weights_path = os.path.join(models_dir, "vqc_weights.pkl")
    joblib.dump({"weights": vqc.weights}, weights_path)

    # Save full VQC model using dill if available
    vqc_model_path = os.path.join(models_dir, "vqc_model.pkl")
    if dill is not None:
        try:
            with open(vqc_model_path, "wb") as f:
                dill.dump(vqc, f)
        except Exception:
            pass

    return vqc


def predict_vqc(vqc, X_q):
    """
    Generates class predictions and class 1 probabilities using trained VQC.
    """
    y_pred = vqc.predict(X_q)

    try:
        y_proba = vqc.predict_proba(X_q)[:, 1]
    except Exception:
        y_proba = None

    return y_pred, y_proba


def evaluate_vqc(vqc, X_test_q, y_test):
    """
    Evaluates trained VQC model on untouched test set.
    """
    y_test_np = y_test.to_numpy() if hasattr(y_test, "to_numpy") else np.array(y_test)
    y_pred, y_proba = predict_vqc(vqc, X_test_q)

    # Confusion matrix
    cm = confusion_matrix(y_test_np, y_pred)
    tn, fp, fn, tp = cm.ravel()

    # Metrics
    acc = accuracy_score(y_test_np, y_pred)
    prec = precision_score(y_test_np, y_pred, zero_division=0)
    rec = recall_score(y_test_np, y_pred, zero_division=0)
    f1 = f1_score(y_test_np, y_pred, zero_division=0)

    # Sensitivity = TP / (TP + FN)
    sensitivity = tp / (tp + fn) if (tp + fn) > 0 else 0.0

    # Specificity = TN / (TN + FP)
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0

    # ROC-AUC score if probabilities available
    if y_proba is not None:
        try:
            roc_auc = roc_auc_score(y_test_np, y_proba)
        except Exception:
            roc_auc = 0.0
    else:
        roc_auc = 0.0

    return {
        "accuracy": acc,
        "precision": prec,
        "recall": rec,
        "f1_score": f1,
        "sensitivity": sensitivity,
        "specificity": specificity,
        "roc_auc": roc_auc,
        "confusion_matrix": cm,
        "tn": tn,
        "fp": fp,
        "fn": fn,
        "tp": tp
    }


def run_hybrid_qml():
    """
    Main function executing the complete Hybrid Quantum Machine Learning Pipeline.
    """
    print("==================================================")
    print("   Hybrid Quantum Machine Learning Model (VQC)")
    print("==================================================")

    # 1. Load Preprocessed Data
    print("\n[1] Loading classical preprocessed data...")
    X_train, X_test, y_train, y_test = get_train_test_data()
    print(f"    Raw Train shape: {X_train.shape}, Test shape: {X_test.shape}")

    # 2. Classical Feature Selection (13 features -> 4 quantum-ready features)
    print("\n[2] Performing Classical Feature Selection (SelectKBest)...")
    X_train_q, X_test_q, selector, selected_features = select_quantum_features(
        X_train, y_train, X_test, n_features=4
    )
    print(f"    Selected 4 Features: {selected_features}")
    print(f"    Quantum Train shape: {X_train_q.shape}, Test shape: {X_test_q.shape}")

    # 3. Build Quantum Circuit & VQC Classifier
    print("\n[3] Building Quantum Circuit & VQC Classifier...")
    num_qubits = 4
    vqc, fmap, ansatz, optimizer, sampler = build_vqc(num_qubits=num_qubits, maxiter=50)

    print(f"    Number of Qubits: {num_qubits}")
    print(f"    Feature Map:      ZZFeatureMap (reps=2, entanglement='linear')")
    print(f"    Ansatz:           RealAmplitudes (reps=2, entanglement='linear')")
    print(f"    Optimizer:        COBYLA (maxiter=50)")
    print(f"    Backend/Simulator: Qiskit StatevectorSampler (Local Simulator)")

    # 4. Train Variational Quantum Classifier
    print("\n[4] Training Variational Quantum Classifier (VQC)...")
    t0 = time.time()
    train_vqc(vqc, X_train_q, y_train)
    t1 = time.time()
    print(f"    VQC Training completed in {t1 - t0:.2f} seconds.")

    # 5. Evaluate VQC on untouched Test Set
    print("\n[5] Evaluating VQC Model on Test Set...")
    metrics = evaluate_vqc(vqc, X_test_q, y_test)

    # 6. Print Confusion Matrix
    print("\n" + "=" * 60)
    print("               VQC CONFUSION MATRIX")
    print("=" * 60)
    print(f"  True Negatives  (TN): {metrics['tn']:2d}  |  False Positives (FP): {metrics['fp']:2d}")
    print(f"  False Negatives (FN): {metrics['fn']:2d}  |  True Positives  (TP): {metrics['tp']:2d}")

    # 7. Print Evaluation Metrics
    print("\n" + "=" * 60)
    print("         VARIATIONAL QUANTUM CLASSIFIER METRICS")
    print("=" * 60)
    print(f"{'Metric':<20} | {'VQC Value':<15}")
    print("-" * 60)
    print(f"{'Accuracy':<20} | {metrics['accuracy']:<15.4f}")
    print(f"{'Precision':<20} | {metrics['precision']:<15.4f}")
    print(f"{'Recall':<20} | {metrics['recall']:<15.4f}")
    print(f"{'F1-Score':<20} | {metrics['f1_score']:<15.4f}")
    print(f"{'Sensitivity':<20} | {metrics['sensitivity']:<15.4f}")
    print(f"{'Specificity':<20} | {metrics['specificity']:<15.4f}")
    print(f"{'ROC-AUC':<20} | {metrics['roc_auc']:<15.4f}")
    print("=" * 60)

    # 8. Confirm Saved Artifacts
    models_dir = os.path.join(BASE_DIR, "models")
    print(f"\n[6] Saved Artifacts in '{models_dir}':")
    print(f"  - quantum_feature_selector.pkl")
    print(f"  - vqc_weights.pkl")
    if os.path.exists(os.path.join(models_dir, "vqc_model.pkl")):
        print(f"  - vqc_model.pkl")

    return metrics


if __name__ == "__main__":
    run_hybrid_qml()

import os
import sys
import time
import json
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

try:
    import dill
except ImportError:
    dill = None

warnings.filterwarnings("ignore")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app.lung_cancer_preprocessing import get_lung_cancer_train_test_data, load_lung_cancer_dataset

MODELS_DIR = os.path.join(BASE_DIR, "models", "lung_cancer")


def select_lung_cancer_quantum_features(X_train, y_train, X_test, feature_names, n_features=4, models_dir=MODELS_DIR):
    """
    Selects top n_features (4) from X_train using ANOVA F-value (SelectKBest).
    Fitted strictly on X_train to prevent data leakage.
    Saves selector object to backend/models/lung_cancer/selector.pkl.
    """
    selector = SelectKBest(score_func=f_classif, k=n_features)
    X_train_q = selector.fit_transform(X_train, y_train)
    X_test_q = selector.transform(X_test)

    selected_indices = selector.get_support(indices=True).tolist()
    selected_feature_names = [feature_names[i] for i in selected_indices]

    os.makedirs(models_dir, exist_ok=True)
    selector_path = os.path.join(models_dir, "selector.pkl")
    joblib.dump(
        {
            "selector": selector,
            "feature_names": selected_feature_names,
            "indices": selected_indices
        },
        selector_path
    )

    return X_train_q, X_test_q, selector, selected_feature_names, selected_indices


def build_lung_cancer_vqc(num_qubits=4, maxiter=50):
    """
    Builds the 4-qubit Variational Quantum Classifier (VQC) using Qiskit.
    - Feature Map: ZZFeatureMap (2 reps, linear entanglement)
    - Ansatz: RealAmplitudes (2 reps, linear entanglement)
    - Optimizer: COBYLA (maxiter iterations)
    - Sampler Primitive: StatevectorSampler
    """
    feature_map_circuit = zz_feature_map(
        feature_dimension=num_qubits,
        reps=2,
        entanglement="linear"
    )

    ansatz_circuit = real_amplitudes(
        num_qubits=num_qubits,
        reps=2,
        entanglement="linear"
    )

    optimizer = COBYLA(maxiter=maxiter)
    sampler = StatevectorSampler()

    step = 0
    def callback(weights, loss_val):
        nonlocal step
        step += 1
        if step % 5 == 0 or step == 1:
            print(f"  Iteration {step:3d} | Optimization Loss: {loss_val:.4f}", flush=True)

    vqc = VQC(
        feature_map=feature_map_circuit,
        ansatz=ansatz_circuit,
        optimizer=optimizer,
        callback=callback,
        sampler=sampler
    )

    return vqc, feature_map_circuit, ansatz_circuit, optimizer, sampler


def train_lung_cancer_vqc(vqc, X_train_q, y_train, models_dir=MODELS_DIR):
    """
    Trains the VQC model on 4 quantum features and saves model artifacts.
    """
    y_train_np = y_train.to_numpy() if hasattr(y_train, "to_numpy") else np.array(y_train)

    vqc.fit(X_train_q, y_train_np)

    os.makedirs(models_dir, exist_ok=True)

    weights_path = os.path.join(models_dir, "vqc_weights.pkl")
    joblib.dump({"weights": vqc.weights}, weights_path)

    vqc_model_path = os.path.join(models_dir, "vqc_model.pkl")
    if dill is not None:
        try:
            with open(vqc_model_path, "wb") as f:
                dill.dump(vqc, f)
        except Exception as e:
            print(f"    Notice: dill serialization failed: {e}")

    return vqc


def predict_lung_cancer_vqc(vqc, X_q):
    """
    Generates class predictions and class 1 decision scores using trained VQC.
    """
    y_pred = vqc.predict(X_q)

    try:
        y_proba = vqc.predict_proba(X_q)[:, 1]
    except Exception:
        y_proba = None

    return y_pred, y_proba


def evaluate_lung_cancer_vqc(vqc, X_test_q, y_test):
    """
    Evaluates trained Lung Cancer VQC model on test set.
    """
    y_test_np = y_test.to_numpy() if hasattr(y_test, "to_numpy") else np.array(y_test)
    y_pred, y_proba = predict_lung_cancer_vqc(vqc, X_test_q)

    cm = confusion_matrix(y_test_np, y_pred)
    tn, fp, fn, tp = cm.ravel()

    acc = accuracy_score(y_test_np, y_pred)
    prec = precision_score(y_test_np, y_pred, zero_division=0)
    rec = recall_score(y_test_np, y_pred, zero_division=0)
    f1 = f1_score(y_test_np, y_pred, zero_division=0)
    sensitivity = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0

    if y_proba is not None:
        try:
            roc_auc = roc_auc_score(y_test_np, y_proba)
        except Exception:
            roc_auc = 0.0
    else:
        roc_auc = 0.0

    return {
        "accuracy": float(acc),
        "precision": float(prec),
        "recall": float(rec),
        "f1_score": float(f1),
        "sensitivity": float(sensitivity),
        "specificity": float(specificity),
        "roc_auc": float(roc_auc),
        "confusion_matrix": [[int(tn), int(fp)], [int(fn), int(tp)]],
        "tn": int(tn),
        "fp": int(fp),
        "fn": int(fn),
        "tp": int(tp)
    }


def run_lung_cancer_pipeline():
    """
    Executes complete Lung Cancer Hybrid QML Pipeline and prints all required verification outputs.
    """
    print("==========================================================================")
    print("   Lung Cancer Hybrid Quantum Machine Learning Model (VQC Pipeline)")
    print("==========================================================================")

    # 1. Load Preprocessed Data
    print("\n[1] Loading Lung Cancer Dataset & Performing Train/Test Split...")
    X_train, X_test, y_train, y_test, feature_names, feature_medians = get_lung_cancer_train_test_data()

    dataset_df = load_lung_cancer_dataset()
    lung_cancer_cases = int((dataset_df['target'] == 1).sum())
    no_cancer_cases = int((dataset_df['target'] == 0).sum())

    print(f"    Dataset Shape:            {dataset_df.shape[0]} samples, {dataset_df.shape[1]} columns")
    print(f"    Feature Count:            {len(feature_names)} features")
    print(f"    Target Distribution:      Lung Cancer (1): {lung_cancer_cases}, No Cancer (0): {no_cancer_cases}")
    print(f"    Train Shape:              {X_train.shape}")
    print(f"    Test Shape:               {X_test.shape}")

    # 2. Quantum Feature Selection
    print("\n[2] Performing Quantum Feature Selection (SelectKBest ANOVA F-value)...")
    X_train_q, X_test_q, selector, selected_features, selected_indices = select_lung_cancer_quantum_features(
        X_train, y_train, X_test, feature_names, n_features=4
    )
    print(f"    Selected Quantum Features: {selected_features}")
    print(f"    Quantum Train Shape:       {X_train_q.shape}")
    print(f"    Quantum Test Shape:        {X_test_q.shape}")

    # 3. Build 4-Qubit VQC Circuit
    print("\n[3] Constructing 4-Qubit Quantum Circuit & VQC Classifier...")
    num_qubits = 4
    vqc, fmap, ansatz, optimizer, sampler = build_lung_cancer_vqc(num_qubits=num_qubits, maxiter=50)

    print(f"    Number of Qubits:         {num_qubits}")
    print(f"    Feature Map:              ZZFeatureMap (reps=2, entanglement='linear')")
    print(f"    Ansatz:                   RealAmplitudes (reps=2, entanglement='linear')")
    print(f"    Optimizer:                COBYLA (maxiter=50)")
    print(f"    Quantum Simulator:        Qiskit StatevectorSampler (Local Simulator)")

    # 4. Train VQC
    print("\n[4] Training Variational Quantum Classifier (VQC)...")
    t0 = time.time()
    train_lung_cancer_vqc(vqc, X_train_q, y_train)
    t1 = time.time()
    print(f"    VQC Training completed successfully in {t1 - t0:.2f} seconds.")

    # 5. Evaluate VQC on Test Set
    print("\n[5] Evaluating VQC Model on Test Set...")
    metrics = evaluate_lung_cancer_vqc(vqc, X_test_q, y_test)

    print("\n" + "=" * 60)
    print("           LUNG CANCER VQC CONFUSION MATRIX")
    print("=" * 60)
    print(f"  True Negatives  (TN): {metrics['tn']:2d}  |  False Positives (FP): {metrics['fp']:2d}")
    print(f"  False Negatives (FN): {metrics['fn']:2d}  |  True Positives  (TP): {metrics['tp']:2d}")

    print("\n" + "=" * 60)
    print("     LUNG CANCER VARIATIONAL QUANTUM CLASSIFIER METRICS")
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

    # 6. Save Metadata JSON
    metadata = {
        "dataset_name": "Survey Lung Cancer Dataset",
        "samples": dataset_df.shape[0],
        "feature_count": len(feature_names),
        "target_distribution": {
            "lung_cancer_positive": lung_cancer_cases,
            "lung_cancer_negative": no_cancer_cases
        },
        "train_samples": X_train.shape[0],
        "test_samples": X_test.shape[0],
        "num_qubits": num_qubits,
        "selected_quantum_features": selected_features,
        "selected_indices": selected_indices,
        "all_feature_names": feature_names,
        "feature_medians": feature_medians,
        "evaluation_metrics": metrics
    }

    metadata_path = os.path.join(MODELS_DIR, "metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=4)

    # 7. Confirm Model Artifacts Saved
    print(f"\n[6] Confirming Saved Model Artifacts in '{MODELS_DIR}':")
    artifact_files = ["scaler.pkl", "selector.pkl", "vqc_weights.pkl", "vqc_model.pkl", "metadata.json"]
    for fname in artifact_files:
        fpath = os.path.join(MODELS_DIR, fname)
        status = "EXISTS" if os.path.exists(fpath) else "MISSING"
        size_str = f"({os.path.getsize(fpath)} bytes)" if status == "EXISTS" else ""
        print(f"  - {fname:<18}: {status} {size_str}")

    # 8. Test Sample Prediction
    print("\n[7] Running Test Sample Prediction...")
    sample_idx = 0
    sample_q_features = X_test_q[sample_idx:sample_idx+1]
    sample_true_label = int(y_test.iloc[sample_idx] if hasattr(y_test, "iloc") else y_test[sample_idx])

    sample_pred_raw, sample_proba_raw = predict_lung_cancer_vqc(vqc, sample_q_features)
    sample_pred = int(np.asarray(sample_pred_raw).flat[0])
    sample_score = float(round(sample_proba_raw[0], 4)) if sample_proba_raw is not None else None

    label_str = "Elevated Risk (Lung Cancer Positive)" if sample_pred == 1 else "Lower Risk (Lung Cancer Negative)"
    true_label_str = "Elevated Risk (Lung Cancer Positive)" if sample_true_label == 1 else "Lower Risk (Lung Cancer Negative)"

    print("\n" + "=" * 60)
    print("               TEST SAMPLE PREDICTION OUTPUT")
    print("=" * 60)
    print(f"  Sample Index:              {sample_idx}")
    print(f"  Selected Quantum Inputs:   {sample_q_features[0].tolist()}")
    print(f"  Ground Truth:              {sample_true_label} ({true_label_str})")
    print(f"  VQC Predicted Class:       {sample_pred}")
    print(f"  VQC Classification Label:  {label_str}")
    print(f"  VQC Decision Score:        {sample_score}")
    print("=" * 60 + "\n")

    return metrics


if __name__ == "__main__":
    run_lung_cancer_pipeline()

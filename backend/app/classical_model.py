import os
import sys
import warnings
import joblib
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix
)

# Suppress sklearn future warnings for clean terminal output
warnings.filterwarnings("ignore")

# Ensure backend directory is in sys.path for direct script execution
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app.preprocessing import get_train_test_data


def evaluate_model(model, X_test, y_test):
    """
    Evaluate a trained binary classification model on the test dataset.
    
    Calculates:
    - Accuracy, Precision, Recall, F1-Score
    - Sensitivity (TP / (TP + FN))
    - Specificity (TN / (TN + FP))
    - ROC-AUC score
    
    Returns:
        dict containing all evaluation metrics and confusion matrix details.
    """
    # Binary predictions
    y_pred = model.predict(X_test)
    
    # Prediction probabilities for class 1 (positive class)
    y_proba = model.predict_proba(X_test)[:, 1]

    # Confusion matrix (tn, fp, fn, tp)
    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = cm.ravel()

    # Performance metrics
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    
    # Sensitivity (True Positive Rate) = TP / (TP + FN)
    sensitivity = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    
    # Specificity (True Negative Rate) = TN / (TN + FP)
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0
    
    # Area Under ROC Curve
    roc_auc = roc_auc_score(y_test, y_proba)

    metrics = {
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

    return metrics


def train_classical_models():
    """
    Train, evaluate, print comparison table, and save Logistic Regression & SVM models.
    """
    print("==================================================")
    print("      Classical Baseline Models Training")
    print("==================================================")

    # 1. Load preprocessed train and test sets
    X_train, X_test, y_train, y_test = get_train_test_data()

    # Define path for saving models
    models_dir = os.path.join(BASE_DIR, "models")
    os.makedirs(models_dir, exist_ok=True)

    # 2. Initialize Classical Models
    # Logistic Regression
    log_reg = LogisticRegression(random_state=42)

    # Support Vector Machine (SVM) with probability=True
    svm = SVC(probability=True, random_state=42)

    # 3. Train models
    print("\nTraining Logistic Regression model...")
    log_reg.fit(X_train, y_train)

    print("Training Support Vector Machine (SVM) model...")
    svm.fit(X_train, y_train)

    # 4. Evaluate models on the same test set
    lr_metrics = evaluate_model(log_reg, X_test, y_test)
    svm_metrics = evaluate_model(svm, X_test, y_test)

    # 5. Save models to backend/models/
    lr_path = os.path.join(models_dir, "logistic_regression.pkl")
    svm_path = os.path.join(models_dir, "svm.pkl")

    joblib.dump(log_reg, lr_path)
    joblib.dump(svm, svm_path)

    print(f"\nSaved models successfully in '{models_dir}':")
    print(f"  - logistic_regression.pkl")
    print(f"  - svm.pkl")

    # 6. Print confusion matrices
    print("\n" + "=" * 60)
    print("                 CONFUSION MATRICES")
    print("=" * 60)
    
    print("\nLogistic Regression Confusion Matrix:")
    print(f"  True Negatives  (TN): {lr_metrics['tn']:2d}  |  False Positives (FP): {lr_metrics['fp']:2d}")
    print(f"  False Negatives (FN): {lr_metrics['fn']:2d}  |  True Positives  (TP): {lr_metrics['tp']:2d}")

    print("\nSupport Vector Machine (SVM) Confusion Matrix:")
    print(f"  True Negatives  (TN): {svm_metrics['tn']:2d}  |  False Positives (FP): {svm_metrics['fp']:2d}")
    print(f"  False Negatives (FN): {svm_metrics['fn']:2d}  |  True Positives  (TP): {svm_metrics['tp']:2d}")

    # 7. Print comparison metrics table
    print("\n" + "=" * 60)
    print("          CLASSICAL MODELS EVALUATION METRICS")
    print("=" * 60)
    print(f"{'Metric':<18} | {'Logistic Regression':<20} | {'SVM':<15}")
    print("-" * 60)

    metric_labels = [
        ("Accuracy", "accuracy"),
        ("Precision", "precision"),
        ("Recall", "recall"),
        ("F1-Score", "f1_score"),
        ("Sensitivity", "sensitivity"),
        ("Specificity", "specificity"),
        ("ROC-AUC", "roc_auc")
    ]

    for label, key in metric_labels:
        lr_val = lr_metrics[key]
        svm_val = svm_metrics[key]
        print(f"{label:<18} | {lr_val:<20.4f} | {svm_val:<15.4f}")

    print("=" * 60)

    return {
        "logistic_regression": lr_metrics,
        "svm": svm_metrics
    }


if __name__ == "__main__":
    train_classical_models()

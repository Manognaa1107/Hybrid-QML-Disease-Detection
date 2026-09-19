import os
import pandas as pd
from sklearn.datasets import load_breast_cancer

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
MODELS_DIR = os.path.join(BASE_DIR, "models", "breast_cancer")
OUTPUT_FILE = os.path.join(DATA_DIR, "breast_cancer.csv")


def ensure_directories():
    """Ensure data and breast_cancer models directories exist."""
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(MODELS_DIR, exist_ok=True)


def download_and_save_dataset():
    """
    Fetch Wisconsin Diagnostic Breast Cancer (WDBC) dataset from sklearn.datasets,
    standardize target encoding (1 = Malignant/Elevated Risk, 0 = Benign/Lower Risk),
    and save to backend/data/breast_cancer.csv.
    """
    ensure_directories()
    print("Fetching Wisconsin Diagnostic Breast Cancer (WDBC) dataset...")

    # Load dataset as pandas dataframe
    data = load_breast_cancer(as_frame=True)
    df = data.frame.copy()

    # sklearn load_breast_cancer target: 0 = malignant, 1 = benign
    # Map target so 1 = Malignant (Elevated Risk), 0 = Benign (Lower Risk) to align with Heart Disease convention
    df["target"] = (df["target"] == 0).astype(int)

    # Save dataset to CSV
    df.to_csv(OUTPUT_FILE, index=False)
    print(f"Breast Cancer dataset successfully saved to: {OUTPUT_FILE}")
    print(f"Dataset shape: {df.shape[0]} rows, {df.shape[1]} columns ({df.shape[1]-1} features + 1 target)")
    print(f"Target distribution: Malignant (1): {(df['target'] == 1).sum()}, Benign (0): {(df['target'] == 0).sum()}")

    return df


if __name__ == "__main__":
    download_and_save_dataset()

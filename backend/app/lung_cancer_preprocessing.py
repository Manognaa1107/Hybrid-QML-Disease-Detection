import os
import joblib
import json
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "lung_cancer.csv")
MODELS_DIR = os.path.join(BASE_DIR, "models", "lung_cancer")
SCALER_PATH = os.path.join(MODELS_DIR, "scaler.pkl")


def load_lung_cancer_dataset(file_path=DATA_PATH):
    """
    Load Lung Cancer dataset from CSV file.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Lung Cancer dataset file not found at: {file_path}")

    df = pd.read_csv(file_path)
    return df


def preprocess_lung_cancer_data(df):
    """
    Preprocess Lung Cancer dataset:
    1. Separate input features (15 features) and target y.
    2. Compute feature median defaults to support flexible user inputs.
    """
    df_clean = df.copy()

    # Separate X (features) and y (target)
    X = df_clean.drop(columns=['target'])
    y = df_clean['target'].astype(int)

    # Calculate dataset median defaults for all 15 features
    feature_medians = X.median().to_dict()

    return X, y, feature_medians


def get_lung_cancer_train_test_data(file_path=DATA_PATH, test_size=0.2, random_state=42, models_dir=MODELS_DIR):
    """
    Load, preprocess, split (80/20 stratified), scale using StandardScaler,
    and save fitted scaler to backend/models/lung_cancer/scaler.pkl.
    
    Returns:
        X_train_scaled, X_test_scaled, y_train, y_test, feature_names, feature_medians
    """
    df = load_lung_cancer_dataset(file_path)
    X, y, feature_medians = preprocess_lung_cancer_data(df)

    feature_names = list(X.columns)

    # Stratified train/test split (80% train, 20% test)
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=test_size,
        random_state=random_state,
        stratify=y
    )

    # Standard scaling
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Save fitted scaler
    os.makedirs(models_dir, exist_ok=True)
    scaler_path = os.path.join(models_dir, "scaler.pkl")
    joblib.dump(scaler, scaler_path)

    return X_train_scaled, X_test_scaled, y_train, y_test, feature_names, feature_medians

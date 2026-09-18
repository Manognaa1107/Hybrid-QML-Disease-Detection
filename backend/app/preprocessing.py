import os
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# Define paths relative to the backend directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "disease.csv")
SCALER_PATH = os.path.join(BASE_DIR, "models", "scaler.pkl")


def load_dataset(file_path=DATA_PATH):
    """
    Load the dataset from the CSV file.
    Treats '?' as missing values (NaN).
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Dataset file not found at: {file_path}")

    # Load CSV data into a pandas DataFrame
    df = pd.read_csv(file_path, na_values="?")
    return df


def preprocess_data(df):
    """
    Preprocess dataset:
    1. Convert target column into binary classification (0 -> 0, 1/2/3/4 -> 1).
    2. Handle missing values in 'ca' and 'thal' using median imputation.
    3. Separate dataset into X (input features) and y (binary target).
    """
    # Create a copy to prevent modifying the original DataFrame
    df_clean = df.copy()

    # 1. Binary target conversion: target = 0 -> 0, target > 0 -> 1
    df_clean['target'] = (df_clean['target'] > 0).astype(int)

    # 2. Handle missing values in 'ca' and 'thal' columns using median imputation
    if 'ca' in df_clean.columns:
        df_clean['ca'] = df_clean['ca'].fillna(df_clean['ca'].median())

    if 'thal' in df_clean.columns:
        df_clean['thal'] = df_clean['thal'].fillna(df_clean['thal'].median())

    # 3. Separate input features (X) and target (y)
    X = df_clean.drop(columns=['target'])
    y = df_clean['target']

    return X, y


def get_train_test_data(file_path=DATA_PATH, test_size=0.2, random_state=42, scaler_path=SCALER_PATH):
    """
    Load, preprocess, split, scale features using StandardScaler,
    and save the fitted scaler to backend/models/scaler.pkl.
    
    Returns:
        X_train_scaled, X_test_scaled, y_train, y_test
    """
    # Load dataset
    df = load_dataset(file_path)

    # Preprocess dataset into X and y
    X, y = preprocess_data(df)

    # Split dataset into training and testing sets with stratification
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=test_size,
        random_state=random_state,
        stratify=y
    )

    # Initialize StandardScaler and scale the input features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Ensure backend/models directory exists and save fitted scaler
    os.makedirs(os.path.dirname(scaler_path), exist_ok=True)
    joblib.dump(scaler, scaler_path)

    return X_train_scaled, X_test_scaled, y_train, y_test

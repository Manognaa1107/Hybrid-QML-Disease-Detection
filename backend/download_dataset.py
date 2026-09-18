import os
import io
import urllib.request
import pandas as pd

# Define paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
MODELS_DIR = os.path.join(BASE_DIR, "models")
OUTPUT_FILE = os.path.join(DATA_DIR, "disease.csv")

# UCI Cleveland Heart Disease Dataset URL
UCI_URL = "https://archive.ics.uci.edu/ml/machine-learning-databases/heart-disease/processed.cleveland.data"

# Standard column names for Cleveland Heart Disease Dataset (13 clinical features + target)
COLUMN_NAMES = [
    "age",
    "sex",
    "cp",
    "trestbps",
    "chol",
    "fbs",
    "restecg",
    "thalach",
    "exang",
    "oldpeak",
    "slope",
    "ca",
    "thal",
    "target"
]


def ensure_directories():
    """Ensure backend/data and backend/models directories exist."""
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(MODELS_DIR, exist_ok=True)
    print(f"Ensured directories exist:\n  - {DATA_DIR}\n  - {MODELS_DIR}")


def download_and_save_dataset():
    """Fetch Cleveland Heart Disease dataset, standardize missing values, and save to CSV."""
    ensure_directories()
    print(f"Fetching Cleveland Heart Disease dataset from: {UCI_URL}")

    req = urllib.request.Request(
        UCI_URL,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            content = response.read().decode("utf-8")
    except Exception as e:
        print(f"Error fetching dataset from primary URL: {e}")
        raise

    # Load raw CSV data with column names and treat '?' as NaN missing values
    df = pd.read_csv(io.StringIO(content), header=None, names=COLUMN_NAMES, na_values="?")

    # Save to backend/data/disease.csv
    df.to_csv(OUTPUT_FILE, index=False)
    print(f"Dataset successfully saved to: {OUTPUT_FILE}")
    print(f"Dataset shape: {df.shape[0]} rows, {df.shape[1]} columns")
    print("\nFirst 5 rows of dataset:")
    print(df.head())
    print("\nMissing values count:")
    print(df.isna().sum())


if __name__ == "__main__":
    download_and_save_dataset()

import os
import io
import urllib.request
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
MODELS_DIR = os.path.join(BASE_DIR, "models", "lung_cancer")
OUTPUT_FILE = os.path.join(DATA_DIR, "lung_cancer.csv")

RAW_URL = "https://raw.githubusercontent.com/rohitinu6/NeoLung/main/survey%20lung%20cancer.csv"


def ensure_directories():
    """Ensure data and lung_cancer models directories exist."""
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(MODELS_DIR, exist_ok=True)


def download_and_save_dataset():
    """
    Fetch Survey Lung Cancer dataset from GitHub raw URL,
    standardize feature & target encodings, and save to backend/data/lung_cancer.csv.
    """
    ensure_directories()
    print(f"Fetching Survey Lung Cancer dataset from: {RAW_URL}")

    req = urllib.request.Request(
        RAW_URL,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            content = response.read()
            df_raw = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        print(f"Error fetching dataset from primary URL: {e}")
        raise

    df = df_raw.copy()

    # Standardize column names (strip whitespace)
    df.columns = df.columns.str.strip()

    # Target encoding: LUNG_CANCER -> 1 for YES (Elevated Risk), 0 for NO (Lower Risk)
    df["LUNG_CANCER"] = (df["LUNG_CANCER"].astype(str).str.upper() == "YES").astype(int)

    # Feature encoding: GENDER -> 1 for M, 0 for F
    df["GENDER"] = (df["GENDER"].astype(str).str.upper() == "M").astype(int)

    # For 1/2 features (SMOKING, YELLOW_FINGERS, etc.), convert 2 (YES) -> 1, 1 (NO) -> 0
    binary_features = [
        "SMOKING", "YELLOW_FINGERS", "ANXIETY", "PEER_PRESSURE",
        "CHRONIC DISEASE", "FATIGUE", "ALLERGY", "WHEEZING",
        "ALCOHOL CONSUMING", "COUGHING", "SHORTNESS OF BREATH",
        "SWALLOWING DIFFICULTY", "CHEST PAIN"
    ]

    for col in binary_features:
        if col in df.columns:
            # If values are 1 and 2, map 2 -> 1, 1 -> 0
            if set(df[col].unique()).issubset({1, 2}):
                df[col] = (df[col] == 2).astype(int)

    # Rename target column to 'target' for consistency across dataset APIs
    df.rename(columns={"LUNG_CANCER": "target"}, inplace=True)

    # Save cleaned dataset to CSV
    df.to_csv(OUTPUT_FILE, index=False)
    print(f"Lung Cancer dataset successfully saved to: {OUTPUT_FILE}")
    print(f"Dataset shape: {df.shape[0]} rows, {df.shape[1]} columns ({df.shape[1]-1} features + 1 target)")
    print(f"Target distribution: Lung Cancer (1): {(df['target'] == 1).sum()}, No Cancer (0): {(df['target'] == 0).sum()}")

    return df


if __name__ == "__main__":
    download_and_save_dataset()

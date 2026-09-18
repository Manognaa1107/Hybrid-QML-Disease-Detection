import os
import sys

# Add backend directory to sys.path so we can import from app.preprocessing
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app.preprocessing import load_dataset, preprocess_data, get_train_test_data


def run_tests():
    print("==================================================")
    print("       Data Preprocessing Verification")
    print("==================================================")

    # 1. Load dataset
    raw_df = load_dataset()
    print(f"\n[1] Loaded Dataset:")
    print(f"    Raw Shape: {raw_df.shape}")

    # 2. Preprocess data into X and y
    X, y = preprocess_data(raw_df)
    print(f"\n[2] Preprocessing Features and Target:")
    print(f"    X shape: {X.shape}")
    print(f"    y shape: {y.shape}")

    # Print missing values after preprocessing
    missing_x = X.isna().sum().sum()
    missing_y = y.isna().sum()
    print(f"\n[3] Missing Values Count After Preprocessing:")
    print(f"    Missing values in X: {missing_x}")
    print(f"    Missing values in y: {missing_y}")

    # 3. Train-Test Split and Scaling
    X_train, X_test, y_train, y_test = get_train_test_data()
    print(f"\n[4] Shapes of Train and Test Sets:")
    print(f"    X_train shape: {X_train.shape}")
    print(f"    X_test shape:  {X_test.shape}")
    print(f"    y_train shape: {y_train.shape}")
    print(f"    y_test shape:  {y_test.shape}")

    # 4. Confirm scaler saved successfully
    scaler_path = os.path.join(BASE_DIR, "models", "scaler.pkl")
    if os.path.exists(scaler_path):
        print(f"\n[5] Scaler Saved Confirmation:")
        print(f"    SUCCESS: Scaler saved at '{scaler_path}'")
    else:
        print(f"\n[5] Scaler Saved Confirmation:")
        print(f"    FAILED: Scaler file not found at '{scaler_path}'")

    print("\n==================================================")


if __name__ == "__main__":
    run_tests()

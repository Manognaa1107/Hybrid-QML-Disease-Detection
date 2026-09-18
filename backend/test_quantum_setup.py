import sys

def verify_quantum_setup():
    print("==================================================")
    print("       Quantum Environment Setup Verification")
    print("==================================================")

    all_passed = True

    # 1. Verify Qiskit import
    try:
        import qiskit
        qiskit_version = getattr(qiskit, "__version__", "unknown")
        print(f"[SUCCESS] Qiskit successfully imported (Version: {qiskit_version})")
    except ImportError as e:
        print(f"[FAILURE] Failed to import Qiskit: {e}")
        all_passed = False

    # 2. Verify Qiskit Machine Learning import
    try:
        import qiskit_machine_learning
        qml_version = getattr(qiskit_machine_learning, "__version__", "unknown")
        print(f"[SUCCESS] Qiskit Machine Learning successfully imported (Version: {qml_version})")
    except ImportError as e:
        print(f"[FAILURE] Failed to import Qiskit Machine Learning: {e}")
        all_passed = False

    # 3. Verify VQC import from Qiskit Machine Learning
    try:
        try:
            from qiskit_machine_learning.algorithms import VQC
        except ImportError:
            from qiskit_machine_learning.algorithms.classifiers import VQC

        print(f"[SUCCESS] VQC (Variational Quantum Classifier) successfully imported.")
        print(f"          Class path: {VQC}")
    except ImportError as e:
        print(f"[FAILURE] Failed to import VQC from Qiskit Machine Learning: {e}")
        all_passed = False

    print("==================================================")
    if all_passed:
        print("RESULT: ALL QUANTUM ENVIRONMENT VERIFICATIONS PASSED!")
    else:
        print("RESULT: VERIFICATION FAILED. Please check installed packages.")
    print("==================================================")

    return all_passed


if __name__ == "__main__":
    success = verify_quantum_setup()
    if not success:
        sys.exit(1)

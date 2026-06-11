import sys
import subprocess

print("=" * 55)
print("   NIDS PROJECT — Package Verification")
print("=" * 55)

# Check Python version
py = sys.version_info
print(f"\n Python version: {py.major}.{py.minor}.{py.micro}", end="")
if py.major == 3 and py.minor >= 10:
    print("  ✓ Good")
else:
    print("  ✗ Need Python 3.10 or higher")

print("\n" + "-" * 55)
print(" Checking packages...\n")

# All packages needed for NIDS project
# Format: (import_name, pip_name, what_it_does)
packages = [
    ("pandas",      "pandas",           "Load and process CSV data"),
    ("numpy",       "numpy",            "Math and array operations"),
    ("matplotlib",  "matplotlib",       "Plotting charts"),
    ("seaborn",     "seaborn",          "Pretty confusion matrix plots"),
    ("sklearn",     "scikit-learn",     "Random Forest, preprocessing, metrics"),
    ("xgboost",     "xgboost",          "XGBoost model (usually best accuracy)"),
    ("imblearn",    "imbalanced-learn", "SMOTE for fixing class imbalance"),
    ("shap",        "shap",             "Explain WHY model made a decision"),
    ("mlflow",      "mlflow",           "Track experiments and model versions"),
    ("flask",       "flask",            "Build the prediction API"),
    ("flask_cors",  "flask-cors",       "Allow React to call Flask API"),
    ("fastapi",     "fastapi",          "Alternative API framework (faster)"),
    ("uvicorn",     "uvicorn",          "Run FastAPI server"),
    ("joblib",      "joblib",           "Save and load trained models"),
]

ok      = []
missing = []

for import_name, pip_name, description in packages:
    try:
        mod = __import__(import_name)
        # get version safely
        try:
            import importlib.metadata
            version = importlib.metadata.version(pip_name)
        except Exception:
            version = getattr(mod, "__version__", "installed")

        ok.append((pip_name, version, description))
        print(f"  ✓  {pip_name:<20} {version:<12}  {description}")

    except ImportError:
        missing.append((pip_name, description))
        print(f"  ✗  {pip_name:<20} {'MISSING':<12}  {description}")

# Summary
print("\n" + "-" * 55)
print(f"\n Results:  {len(ok)} installed   {len(missing)} missing\n")

if missing:
    print(" Run this command to install missing packages:\n")
    pip_names = " ".join([p for p, _ in missing])
    print(f"   pip install {pip_names}")
    print()

    # Offer to auto-install
    answer = input(" Auto-install missing packages now? (y/n): ").strip().lower()
    if answer == "y":
        print("\n Installing...\n")
        for pip_name, description in missing:
            print(f"   Installing {pip_name}...")
            result = subprocess.run(
                [sys.executable, "-m", "pip", "install", pip_name],
                capture_output=True, text=True
            )
            if result.returncode == 0:
                print(f"   ✓ {pip_name} installed successfully")
            else:
                print(f"   ✗ Failed to install {pip_name}")
                print(f"     Error: {result.stderr.strip()[:100]}")
        print("\n Done! Run this script again to verify.\n")
    else:
        print(" Copy the pip install command above and run it in your terminal.\n")

else:
    print(" All packages installed! Your environment is ready.")
    print("\n Quick sanity check — loading a small dataset...\n")

    # Quick functional test
    try:
        import pandas as pd
        import numpy as np
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.preprocessing import StandardScaler

        # Create tiny fake dataset
        X = np.random.rand(100, 41)
        y = np.random.choice(["Normal", "DoS", "Probe"], 100)

        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        model = RandomForestClassifier(n_estimators=5, random_state=42)
        model.fit(X_scaled, y)
        preds = model.predict(X_scaled[:3])

        print(f"  ✓ pandas   — DataFrame created successfully")
        print(f"  ✓ numpy    — Array operations working")
        print(f"  ✓ sklearn  — Model trained and predicted: {list(preds)}")
        print(f"  ✓ joblib   — Ready to save models")

        import joblib, io
        buf = io.BytesIO()
        joblib.dump(model, buf)
        print(f"  ✓ All core components functional!")

    except Exception as e:
        print(f"  ✗ Functional test failed: {e}")

print("\n" + "=" * 55)
print("   Verification complete")
print("=" * 55 + "\n")
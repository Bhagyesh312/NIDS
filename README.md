# NIDS — Network Intrusion Detection System

A machine learning based system that detects network intrusions and classifies attack types using the KDD Cup 99 and CICIDS2017 datasets.

## Attack Categories
- **Normal** — Legitimate traffic
- **DoS** — Denial of Service attacks
- **Probe** — Surveillance and scanning
- **R2L** — Remote to Local attacks
- **U2R** — User to Root attacks

---

## Project Structure

```
NIDS/
├── data/
│   ├── raw/                        # Original datasets (not pushed to GitHub)
│   │   ├── KDDTrain+.txt
│   │   ├── KDDTest+.txt
│   │   └── CICIDS2017/             # CSV files per day
│   └── processed/                  # Cleaned and feature-engineered data
├── notebooks/
│   └── 01_eda_nslkdd.ipynb         # EDA on NSL-KDD dataset
├── models/                         # Saved trained models (.pkl, .json)
├── backend/                        # Flask / FastAPI prediction API
├── frontend/                       # React dashboard
├── venv/                           # Virtual environment (not pushed to GitHub)
├── load_kdd.py                     # Load and label KDD dataset
├── load_cicids.py                  # Combine and clean CICIDS2017 dataset
├── check_env.py                    # Verify Python environment and packages
├── requirements.txt                # All project dependencies
└── .gitignore
```

---

## Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/Bhagyesh312/NIDS.git
cd NIDS
```

### 2. Create a virtual environment
```bash
python -m venv venv

# Activate on Windows
venv\Scripts\activate

# Activate on Mac/Linux
source venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Add the datasets
Download the datasets and place them in the correct folders:
- `data/raw/KDDTrain+.txt`
- `data/raw/KDDTest+.txt`
- `data/raw/CICIDS2017/*.csv`

> Data files are excluded from GitHub via `.gitignore` due to their large size.

### 5. Verify your environment
```bash
python check_env.py
```

---

## Datasets

| Dataset | Source | Size |
|---|---|---|
| KDD Cup 99 | NSL-KDD | ~126K train / ~22K test rows |
| CICIDS2017 | Canadian Institute for Cybersecurity | ~2.8M rows, 79 features |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Data Processing | pandas, numpy |
| ML Models | scikit-learn, XGBoost |
| Explainability | SHAP |
| Experiment Tracking | MLflow |
| Backend API | Flask / FastAPI |
| Frontend | React |
| Visualization | matplotlib, seaborn |

---

## Contributors
- Bhagyesh — [@Bhagyesh312](https://github.com/Bhagyesh312)
- Aditya — [@adityasitapara](https://github.com/adityasitapara)

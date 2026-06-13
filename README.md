# NIDS — Network Intrusion Detection System

A machine learning powered security dashboard that detects and classifies network intrusions in real time — built on the NSL-KDD and CICIDS2017 datasets using XGBoost with SMOTE-balanced training.

## Attack Categories

| Category | Color | Description |
|---|---|---|
| **Normal** | 🟢 Green | Legitimate network traffic |
| **DoS** | 🔴 Red | Denial of Service attacks (neptune, smurf, back…) |
| **Probe** | 🔵 Sky Blue | Surveillance and scanning (portsweep, nmap, ipsweep…) |
| **R2L** | 🟡 Amber | Remote to Local attacks (guess_passwd, ftp_write…) |
| **U2R** | 🟣 Purple | User to Root attacks (buffer_overflow, rootkit…) |

---

## Project Structure

```
NIDS/
├── data/
│   ├── raw/                        # Original datasets (not pushed to GitHub)
│   │   ├── KDDTrain+.txt
│   │   ├── KDDTest+.txt
│   │   └── CICIDS2017/             # 8 CSV files (one per day)
│   └── processed/                  # Generated after running preprocessing notebook
│       ├── X_train.npy / y_train.npy
│       ├── X_val.npy   / y_val.npy
│       ├── X_test.npy  / y_test.npy
│       ├── scaler.pkl
│       ├── label_encoders.pkl
│       ├── target_encoder.pkl
│       └── feature_names.pkl
├── notebooks/
│   ├── 01_eda_nslkdd.ipynb         # Exploratory Data Analysis
│   └── 02_preprocessing.ipynb      # Encoding, SMOTE, scaling, save processed data
├── models/                         # Saved trained models (generated after training)
├── backend/                        # FastAPI prediction API (in progress)
├── frontend/                       # React + Vite dashboard
│   ├── src/
│   │   ├── components/             # Sidebar, Header, StatCards, Badge, ThreatFeed, CommandPalette
│   │   ├── pages/                  # Dashboard, Predict, Batch, ModelInfo
│   │   ├── lib/                    # api.js, colors.js, readyContext.js
│   │   └── hooks/                  # useCountUp.js
│   └── package.json
├── venv/                           # Virtual environment (not pushed to GitHub)
├── load_kdd.py                     # Load and label KDD dataset
├── load_cicids.py                  # Combine and clean CICIDS2017 dataset
├── requirements.txt                # Python dependencies
└── .gitignore
```

---

## Dashboard Features

- **Live Stat Cards** — Total traffic, attacks detected, normal traffic, model confidence with count-up animation
- **Traffic Overview** — Dual Y-axis area chart with time range filters (6h / 12h / 24h / 7d)
- **Attack Distribution** — Animated donut chart with percentage bars per category
- **Recent Alerts** — Filterable table by attack type (All / DoS / Probe / R2L / U2R) with staggered row animations
- **Threat Feed** — Terminal-style live stream of simulated network events (slide-in panel)
- **Command Palette** — Press `Ctrl K` to search pages and look up attack types
- **Welcome Modal** — Intro screen on first visit, all dashboard animations trigger on entry

---

## Setup Instructions

### Backend (Python)

```bash
# 1. Clone the repo
git clone https://github.com/Bhagyesh312/NIDS.git
cd NIDS

# 2. Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux

# 3. Install dependencies
pip install -r requirements.txt

# 4. Add datasets to data/raw/
#    KDDTrain+.txt, KDDTest+.txt, CICIDS2017/*.csv

# 5. Run EDA notebook
jupyter lab notebooks/01_eda_nslkdd.ipynb

# 6. Run preprocessing
jupyter lab notebooks/02_preprocessing.ipynb
```

### Frontend (React)

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

> Data files and `node_modules` are excluded via `.gitignore`.

---

## Datasets

| Dataset | Source | Rows | Features |
|---|---|---|---|
| NSL-KDD | Canadian Institute for Cybersecurity | ~126K train / ~22K test | 41 |
| CICIDS2017 | Canadian Institute for Cybersecurity | ~2.8M | 79 |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Data Processing | pandas, numpy |
| Class Balancing | imbalanced-learn (SMOTE) |
| ML Models | scikit-learn, XGBoost |
| Explainability | SHAP |
| Experiment Tracking | MLflow |
| Backend API | FastAPI + uvicorn |
| Frontend | React 19 + Vite |
| Charts | Recharts |
| Animations | Framer Motion, Lenis |
| Icons | Lucide React |
| Styling | Tailwind CSS |

---

## Contributors
- Bhagyesh — [@Bhagyesh312](https://github.com/Bhagyesh312)
- Aditya — [@adityasitapara](https://github.com/adityasitapara)

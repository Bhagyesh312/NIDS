# NIDS — Network Intrusion Detection System

A machine learning powered security dashboard that detects and classifies network intrusions in real time — built on the NSL-KDD and CICIDS2017 datasets using XGBoost with SMOTE-balanced training.

## Attack Categories

| Category | Color | Description |
|---|---|---|
| **Normal** | 🟢 `#22c55e` | Legitimate network traffic |
| **DoS** | 🔴 `#ef4444` | Denial of Service attacks (neptune, smurf, back…) |
| **Probe** | 🔵 `#38bdf8` | Surveillance and scanning (portsweep, nmap, ipsweep…) |
| **R2L** | 🟡 `#f59e0b` | Remote to Local attacks (guess_passwd, ftp_write…) |
| **U2R** | 🟣 `#a78bfa` | User to Root attacks (buffer_overflow, rootkit…) |

> All 5 colors are defined once in `frontend/src/lib/colors.js` and imported everywhere — no hardcoded values in components.

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
│   │   ├── components/             # UI components (see below)
│   │   ├── pages/                  # Dashboard, Alerts, Predict, Batch, Globe, Info, ModelInfo
│   │   ├── lib/                    # api.js, colors.js, readyContext.js
│   │   └── hooks/                  # useCountUp.js
│   ├── package.json
│   └── package-lock.json           # Locked dependency versions for reproducible installs
├── venv/                           # Virtual environment (not pushed to GitHub)
├── load_kdd.py                     # Load and label KDD dataset
├── load_cicids.py                  # Combine and clean CICIDS2017 dataset
├── requirements.txt                # Python dependencies
└── .gitignore
```

---

## Dashboard Pages

| Page | Route | Description |
|---|---|---|
| Dashboard | `/` | Live stat cards, traffic chart, donut, recent alerts |
| Alerts | `/alerts` | Full sortable/filterable alert table with CSV export |
| Predict | `/predict` | Single flow prediction form with confidence display |
| Batch | `/batch` | Upload CSV for bulk predictions |
| Globe | `/globe` | Interactive 3D threat origin map |
| Info | `/info` | Attack type encyclopedia with detection features |
| Model Info | `/model` | Confusion matrix, feature importance, model details |

---

## Frontend Features & Animations

- **Welcome Modal** — Intro screen on first visit; all dashboard animations are gated and only trigger after clicking "Enter Dashboard"
- **Flowing Menu** — Hamburger-triggered sidebar overlay with cascading wave animation (blur → clear stagger per link)
- **Stat Cards** — UIverse.io 3D ticket-style cards with scrolling grid background, 3D hover tilt, and shimmer overlay
- **Count-up Numbers** — All stat values animate from 0 using `requestAnimationFrame` + `easeOutExpo`
- **Traffic Chart** — Dual Y-axis area chart with time range filter (6h / 12h / 24h / 7d) and animated chart switch
- **Donut Chart** — Animated spin-in with percentage bars that fill on load
- **Alerts Table** — Sortable, searchable, paginated; rows animate in with stagger; live filter with exit animations
- **Threat Feed** — Terminal-style sliding panel with live mock event stream, pause/play, attack count flash
- **Command Palette** — `Ctrl K` spotlight search with blur backdrop, keyboard navigation, attack type info
- **Globe** — Interactive 3D globe (globe.gl + three.js) with pulsing attack rings, animated arcs, glassmorphism popup
- **Error Boundary** — Catches any render crash with a recovery UI
- **Skeleton Loaders** — Shimmer placeholders shown during simulated data fetching
- **Page Titles** — Each page updates `document.title` dynamically

---

## UIverse.io Credits

UI components sourced and adapted from [UIverse.io](https://uiverse.io) — colors and styles adjusted to match the NIDS dark theme:

| Component | Author | Used In |
|---|---|---|
| 3D Ticket Stat Card | [zeeshan_2112](https://uiverse.io/zeeshan_2112) | Dashboard stat cards |
| Gradient Push Button | [hakemdamer222](https://uiverse.io/hakemdamer222) | Predict page submit button |
| Sliding Invert Loader | [Uncannypotato69](https://uiverse.io/Uncannypotato69) | Predict page loading state |

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
python -m jupyter lab notebooks/01_eda_nslkdd.ipynb

# 6. Run preprocessing
python -m jupyter lab notebooks/02_preprocessing.ipynb
```

### Frontend (React)

```bash
cd frontend
npm install        # installs exact versions from package-lock.json
npm run dev
# Opens at http://localhost:5173
```

> Data files and `node_modules` are excluded via `.gitignore`.  
> `package-lock.json` is committed so both collaborators get identical dependency trees.

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
| 3D Globe | globe.gl + three.js |
| Animations | Framer Motion |
| Smooth Scroll | Lenis |
| Icons | Lucide React |
| Styling | Tailwind CSS + custom CSS |
| UI Components | UIverse.io (adapted) |

---

## Contributors
- Bhagyesh — [@Bhagyesh312](https://github.com/Bhagyesh312)
- Aditya — [@adityasitapara](https://github.com/adityasitapara)

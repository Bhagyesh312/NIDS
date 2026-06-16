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

> All 5 colors are defined once in `frontend/src/lib/colors.js` — imported everywhere, never hardcoded.

---

## Project Structure

```
NIDS/
├── data/
│   ├── raw/                          # Datasets (not pushed to GitHub)
│   │   ├── KDDTrain+.txt
│   │   ├── KDDTest+.txt
│   │   └── CICIDS2017/
│   └── processed/                    # Generated after preprocessing notebook
│       ├── X_train.npy / y_train.npy
│       ├── X_val.npy   / y_val.npy
│       ├── X_test.npy  / y_test.npy
│       ├── scaler.pkl
│       ├── label_encoders.pkl
│       ├── target_encoder.pkl
│       └── feature_names.pkl
├── notebooks/
│   ├── 01_eda_nslkdd.ipynb           # Exploratory Data Analysis
│   └── 02_preprocessing.ipynb        # Encoding, SMOTE, scaling
├── models/                           # Saved trained models (after training)
├── backend/                          # FastAPI + PostgreSQL API
│   ├── main.py                       # App entry, CORS, validation errors
│   ├── database.py                   # PostgreSQL via SQLAlchemy + .env
│   ├── models.py                     # predictions DB table
│   ├── schemas.py                    # Pydantic request/response + validation
│   ├── ml.py                         # Load model, preprocess, predict
│   ├── routes/
│   │   ├── predict.py                # POST /predict, POST /predict/batch
│   │   ├── alerts.py                 # GET /alerts, /alerts/count
│   │   ├── stats.py                  # GET /stats, /model-info, /globe-stats
│   │   └── reports.py                # GET /reports/summary
│   ├── .env.example                  # Template for environment variables
│   └── README.md
├── frontend/                         # React 19 + Vite dashboard
│   ├── src/
│   │   ├── components/               # UI components
│   │   ├── pages/                    # All 9 pages
│   │   ├── lib/                      # api.js, colors.js, readyContext.js,
│   │   │                             # alertsStore.js, themeContext.jsx
│   │   └── hooks/                    # useCountUp.js
│   ├── package.json
│   └── package-lock.json
├── venv/                             # Virtual environment (not in GitHub)
├── load_kdd.py
├── load_cicids.py
├── requirements.txt
└── .gitignore
```

---

## Dashboard Pages

| Page | Route | Description |
|---|---|---|
| Dashboard | `/` | Live stat cards, traffic chart, donut, alerts |
| Alerts | `/alerts` | Sortable/filterable table, real API data, CSV export |
| Predict | `/predict` | Single flow prediction, sample fill buttons |
| Batch | `/batch` | CSV upload, category summary, bulk results |
| Globe | `/globe` | Interactive 3D attack origin map |
| Info | `/info` | Attack type encyclopedia |
| Model Info | `/model` | Confusion matrix, feature importance |
| Reports | `/reports` | Weekly/monthly charts, breakdown, top IPs |
| Settings | `/settings` | Theme toggle, notifications, API config |

---

## Backend API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check + model status |
| GET | `/health` | DB + model check |
| POST | `/predict` | Single flow prediction → saved to DB |
| POST | `/predict/batch` | CSV bulk prediction → saved to DB |
| GET | `/alerts` | Attack alerts from DB (filterable) |
| GET | `/alerts/count` | Unread count for sidebar badge |
| GET | `/stats` | Dashboard statistics |
| GET | `/model-info` | Model metadata + confusion matrix |
| GET | `/globe-stats` | Attack origins by source IP |
| GET | `/reports/summary` | Weekly/category breakdown |

---

## Frontend Features & Animations

- **Welcome Modal** — Intro screen; all animations gate until "Enter Dashboard" clicked
- **Flowing Menu** — Hamburger overlay with cascading wave animation
- **Stat Cards** — UIverse.io 3D ticket-style cards with scrolling grid, 3D tilt
- **Count-up Numbers** — `requestAnimationFrame` + `easeOutExpo`
- **Traffic Chart** — Dual Y-axis area chart with time range filter (6h/12h/24h/7d)
- **Donut Chart** — Animated spin-in with percentage bars
- **Alerts Table** — Real API data, sortable, searchable, paginated, CSV export
- **Reports Charts** — Bar chart with dark cursor + glow hover, line chart
- **Globe** — 3D interactive globe with pulsing rings, arcs, glassmorphism popup
- **Threat Feed** — Terminal-style live event stream (slide-in panel)
- **Command Palette** — `Ctrl K` spotlight search
- **Dark/Light Mode** — Settings toggle, CSS variables, saved to localStorage
- **Error Boundary** — Graceful crash recovery on all pages
- **Skeleton Loaders** — Shimmer placeholders during data fetching

---

## UIverse.io Credits

UI components sourced from [UIverse.io](https://uiverse.io) — adapted to NIDS dark theme:

| Component | Author | Used In |
|---|---|---|
| 3D Ticket Stat Card | [zeeshan_2112](https://uiverse.io/zeeshan_2112) | Dashboard stat cards |
| Gradient Push Button | [hakemdamer222](https://uiverse.io/hakemdamer222) | Predict page submit button |
| Sliding Invert Loader | [Uncannypotato69](https://uiverse.io/Uncannypotato69) | Predict page loading state |

---

## Setup Instructions

### Backend (Python + PostgreSQL)

```bash
# 1. Clone the repo
git clone https://github.com/Bhagyesh312/NIDS.git
cd NIDS

# 2. Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux

# 3. Install dependencies
pip install -r requirements.txt
pip install fastapi uvicorn sqlalchemy psycopg2-binary python-multipart pandas joblib python-dotenv

# 4. Create PostgreSQL database named NIDS in pgAdmin4

# 5. Configure environment
cd backend
cp .env.example .env
# Edit .env with your PostgreSQL password

# 6. Start the backend
uvicorn main:app --reload
# API docs at http://localhost:8000/docs
```

### Frontend (React)

```bash
cd frontend
npm install        # uses package-lock.json for exact versions
npm run dev
# Opens at http://localhost:5173
```

### ML Notebooks

```bash
# Run in order:
python -m jupyter lab notebooks/01_eda_nslkdd.ipynb
python -m jupyter lab notebooks/02_preprocessing.ipynb
# Then your teammate runs 03_model_training.ipynb (coming soon)
```

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
| Database | PostgreSQL + SQLAlchemy |
| Frontend | React 19 + Vite |
| Charts | Recharts |
| 3D Globe | globe.gl + three.js |
| Animations | Framer Motion |
| Icons | Lucide React |
| Styling | Tailwind CSS + custom CSS |
| UI Components | UIverse.io (adapted) |

---

## Contributors
- Bhagyesh — [@Bhagyesh312](https://github.com/Bhagyesh312)
- Aditya — [@adityasitapara](https://github.com/adityasitapara)

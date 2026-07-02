# NIDS Backend — FastAPI + PostgreSQL

FastAPI backend for the NIDS dashboard. Handles ML predictions, stores results in PostgreSQL, and serves all dashboard API endpoints.

---

## Requirements

- Python 3.10+
- PostgreSQL 14+ with a database named `NIDS`
- Trained model artifacts at `models/model.pkl` (run `notebooks/03_model_training.ipynb` first)

---

## Quick Start

```bash
# From the NIDS root
cd backend

# Install dependencies (if not done at root level)
pip install -r ../requirements.txt

# Configure environment
copy .env.example .env     # Windows
# cp .env.example .env     # macOS / Linux

# Edit .env — set your PostgreSQL password:
# DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/NIDS

# Start the server
uvicorn main:app --reload
```

- API root: http://localhost:8000  
- Interactive docs: http://localhost:8000/docs  

Tables are auto-created on first startup via SQLAlchemy — no migration scripts needed.

---

## File Structure

```
backend/
├── main.py          # FastAPI app, CORS, lifespan startup, error handlers
├── database.py      # SQLAlchemy engine + session factory + connection pool
├── models.py        # Prediction ORM table with composite indexes
├── schemas.py       # Pydantic v2 schemas:
│                    #   PredictRequest (KDD 40-feature)
│                    #   CICIDSPredictRequest (69-feature, extra="allow")
│                    #   PredictResponse, AlertOut, StatsResponse, ModelInfoResponse
├── ml.py            # Artifact loader, preprocess(), predict_single(), predict_batch()
├── routes/
│   ├── predict.py   # POST /predict, POST /predict/batch, GET /predict/models
│   ├── alerts.py    # GET /alerts, /alerts/count, /alerts/all
│   ├── stats.py     # GET /stats, /stats/traffic, /model-info, /globe-stats
│   ├── reports.py   # GET /reports/summary
│   └── simulate.py  # POST /simulate/start|stop, GET /simulate/status
├── .env             # Local secrets — gitignored
└── .env.example     # Safe template — committed
```

---

## API Endpoints

### Health

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check + model loaded status |
| GET | `/health` | DB + model ready status |

### Predictions

| Method | Endpoint | Description |
|---|---|---|
| POST | `/predict?model=kdd` | Classify a single NSL-KDD flow; saves to DB |
| POST | `/predict?model=cicids` | Classify a single CICIDS2017 flow; saves to DB |
| POST | `/predict/batch?model=kdd\|cicids` | Bulk-classify a CSV file; saves all to DB |
| GET | `/predict/models` | Which models are loaded and ready |

### Alerts

| Method | Endpoint | Description |
|---|---|---|
| GET | `/alerts` | Attack predictions from DB (filter by type/source/model, paginated) |
| GET | `/alerts/count` | Unread attack count for sidebar badge |
| GET | `/alerts/all` | All predictions including normal traffic |

### Stats & Model Info

| Method | Endpoint | Description |
|---|---|---|
| GET | `/stats?model=kdd\|cicids` | Total / attack / normal counts + distribution + accuracy |
| GET | `/stats/traffic?range=24h&model=kdd` | Time-bucketed `{t, n, a}` for the traffic chart |
| GET | `/model-info?model=kdd\|cicids` | Algorithm, accuracy, confusion matrix, feature importance |
| GET | `/globe-stats?model=kdd\|cicids` | Attack counts grouped by src_ip for globe page |

### Reports

| Method | Endpoint | Description |
|---|---|---|
| GET | `/reports/summary?model=kdd\|cicids` | Category totals, daily breakdown, monthly trend, top IPs |

### Live Simulation

| Method | Endpoint | Description |
|---|---|---|
| POST | `/simulate/start?model=kdd\|cicids&interval=5&batch_size=5` | Start background simulation from test set |
| POST | `/simulate/stop` | Stop running simulation |
| GET | `/simulate/status` | Simulation running state + sent/attack counters |

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:kali@localhost:5432/NIDS` | Full PostgreSQL connection string |

---

## Database Table

The `predictions` table stores every prediction (single, batch, and simulation):

| Column | Type | Description |
|---|---|---|
| `id` | Integer PK | Auto-increment |
| `src_ip` | String(50) | Source IP (optional) |
| `dst_ip` | String(50) | Destination IP (optional) |
| `protocol` | String(10) | tcp / udp / icmp |
| `service` | String(30) | http / ftp / ssh etc |
| `prediction` | String(50) | Normal / DoS / Probe / R2L / U2R / Benign / DDoS … |
| `confidence` | Float | 0.0 – 1.0 |
| `subtype` | String(50) | neptune / portsweep etc (optional) |
| `source` | String(20) | `single`, `batch`, or `simulate` |
| `batch_id` | String(50) | Groups batch predictions together |
| `model_used` | String(10) | `kdd` or `cicids` |
| `raw_features` | Text | JSON of input features |
| `created_at` | DateTime | Auto-set by DB server |

Composite indexes: `(model_used, created_at)`, `(model_used, prediction)`, `(model_used, src_ip)`.

---

## ML Artifacts

Loaded at startup from:

| Artifact | Path |
|---|---|
| KDD model | `models/model.pkl` |
| KDD scaler | `data/processed/scaler.pkl` |
| KDD label encoders | `data/processed/label_encoders.pkl` |
| KDD target encoder | `data/processed/target_encoder.pkl` |
| KDD feature names | `data/processed/feature_names.pkl` |
| CICIDS model | `models/cicids_model.pkl` |
| CICIDS scaler | `data/processed/cicids/scaler.pkl` |
| CICIDS target encoder | `data/processed/cicids/target_encoder.pkl` |
| CICIDS feature names | `data/processed/cicids/feature_names.pkl` |

If a model's artifacts are missing, the other model still loads and the API serves a 503 for the missing one.

# AI-Assisted Student Stress Prediction (Full-Stack)

This repo contains:

- `backend/`: FastAPI + MySQL + JWT auth + `/predict` + `/history`
- `ml/`: notebooks/data/models (to be added)
- `frontend/`: React (Vite) (to be generated)

## Backend (FastAPI)

### 1) Create venv & install dependencies

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2) Configure environment variables

Copy `backend/.env.example` to `backend/.env` and update values:

- `DATABASE_URL`
- `JWT_SECRET_KEY`

Then export them (simple approach):

```bash
export $(cat .env | xargs)
```

### 3) Run API

```bash
uvicorn main:app --reload --port 8000
```

API health check: `GET /health`

## Frontend (React + Vite)

You need Node.js (includes `npm`).

Once installed:

```bash
cd ..
npm create vite@latest frontend -- --template react
cd frontend
npm install axios react-router-dom chart.js react-chartjs-2
npm run dev
```


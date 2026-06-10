from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from dotenv import load_dotenv

# Configure logging so history/predict endpoint logs are visible
logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(name)s: %(message)s")

# .env dosyasını backend/ klasöründen yükle
_env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(_env_path)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from ml_model import predictor
from routers import auth as auth_router
from routers import history as history_router
from routers import predict as predict_router


app = FastAPI(
    title="AI-Assisted Student Stress Prediction API",
    description="Üniversite öğrencileri için AI destekli stres tahmin sistemi — İstanbul Topkapı Üniversitesi Bitirme Projesi",
    version="1.0.0",
)

origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    predictor.try_load()
    print(f"[startup] Model loaded: {predictor._loaded}")
    print(f"[startup] CORS origins: {origins}")


app.include_router(auth_router.router)
app.include_router(predict_router.router)
app.include_router(history_router.router)


@app.get("/health")
def health():
    return {
        "ok": True,
        "model_loaded": predictor._loaded,
        "model_type": type(predictor._model).__name__ if predictor._model else "MockHeuristic",
    }

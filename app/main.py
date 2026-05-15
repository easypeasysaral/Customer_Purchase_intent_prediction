from contextlib import asynccontextmanager
from typing import List
import logging
import time

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib
import pandas as pd
import numpy as np

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

ml: dict = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Loading model bundle...")
    try:
        bundle        = joblib.load("model_bundle.pkl")
        ml["model"]   = bundle["model"]
        ml["scaler"]  = bundle["scaler"]
        ml["features"]= bundle["features"]
        ml["meta"]    = {
            "model_type":  bundle.get("model_type", "xgboost"),
            "best_params": bundle.get("best_params", {}),
            "cv_auc":      bundle.get("cv_auc", None),
        }
        logger.info("Model loaded ✓  features=%d  cv_auc=%s",
                    len(ml["features"]), ml["meta"]["cv_auc"])
    except FileNotFoundError:
        logger.error("model_bundle.pkl not found — run the notebook first!")
        raise
    yield                          # app runs here
    ml.clear()
    logger.info("Model released.")

app = FastAPI(
    title="Customer Purchase Intent Predictor",
    description="Predicts whether an ecommerce session will end in a purchase.",
    version="2.0.0",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",    # React dev server (CRA)
        "http://localhost:5173",    # Vite dev server
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*",                        # change to your domain in production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Schemas ──────────────────────────────────────────────────────────────────
class SessionFeatures(BaseModel):
    session_duration:     float = Field(..., ge=0, description="Session duration in seconds")
    session_length:       float = Field(..., ge=0, description="Total event count in session")
    unique_products:      float = Field(..., ge=0, description="Distinct products viewed")
    cart_count:           float = Field(..., ge=0, description="Number of cart-add events")
    view_count:           float = Field(..., ge=0, description="Number of view events")
    cart_view_ratio:      float = Field(..., ge=0, le=10, description="cart_count / view_count")
    avg_time_gap:         float = Field(..., ge=0, description="Average seconds between events")
    repeat_product_views: float = Field(..., ge=0, description="Products viewed more than once")
    unique_categories:    float = Field(..., ge=0, description="Distinct categories browsed")
    avg_price:            float = Field(..., ge=0, description="Mean price of viewed items (USD)")
    max_price:            float = Field(..., ge=0, description="Max price of viewed items (USD)")
    price_std:            float = Field(..., ge=0, description="Std deviation of prices (USD)")
    dayofweek:            float = Field(..., ge=0, le=6, description="0=Monday … 6=Sunday")


class PredictionResponse(BaseModel):
    will_purchase:        bool
    purchase_probability: float
    model_type:           str
    cv_auc:               float | None = None


class BatchResponse(BaseModel):
    will_purchase:        bool
    purchase_probability: float


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health", tags=["Monitoring"])
def health():
    """Liveness check — load balancers aur monitoring tools ke liye."""
    return {
        "status":     "ok",
        "model_type": ml.get("meta", {}).get("model_type"),
        "features":   len(ml.get("features", [])),
    }


@app.get("/features", tags=["Monitoring"])
def get_features():
    """Returns the exact feature list and order the model expects."""
    return {
        "features": ml["features"],
        "count":    len(ml["features"]),
    }


@app.post("/predict", response_model=PredictionResponse, tags=["Inference"])
def predict(session: SessionFeatures):
    t0 = time.perf_counter()
    try:
        # FIX: model_dump() — Pydantic v2 compatible (dict() is deprecated)
        input_df = pd.DataFrame([session.model_dump()])[ml["features"]]
        prob     = float(ml["model"].predict_proba(input_df)[0][1])
        latency  = round((time.perf_counter() - t0) * 1000, 2)

        logger.info(
            "predict  prob=%.4f  will_purchase=%s  latency=%sms",
            prob, prob >= 0.5, latency
        )

        return PredictionResponse(
            will_purchase        = prob >= 0.5,
            purchase_probability = round(prob, 4),
            model_type           = ml["meta"]["model_type"],
            cv_auc               = ml["meta"]["cv_auc"],
        )
    except Exception as e:
        logger.exception("predict failed")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/batch", response_model=List[BatchResponse], tags=["Inference"])
def predict_batch(sessions: List[SessionFeatures]):
    if len(sessions) > 1000:
        raise HTTPException(status_code=400, detail="Max 1000 sessions per batch.")
    try:
        # FIX: model_dump() for each item
        input_df = pd.DataFrame(
            [s.model_dump() for s in sessions]
        )[ml["features"]]
        probs = ml["model"].predict_proba(input_df)[:, 1]

        logger.info("batch predict  n=%d  avg_prob=%.4f", len(sessions), float(probs.mean()))

        return [
            BatchResponse(
                will_purchase        = bool(p >= 0.5),
                purchase_probability = round(float(p), 4),
            )
            for p in probs
        ]
    except Exception as e:
        logger.exception("batch predict failed")
        raise HTTPException(status_code=500, detail=str(e))


# ─── Dev runner ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
from typing import List, Optional
import logging
import time
from pathlib import Path

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

app = FastAPI(
    title="Customer Purchase Intent Predictor",
    description="Predicts whether an ecommerce session will end in a purchase.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def load_model():
    logger.info("Loading model bundle...")
    try:
        
        p_joblib = Path("best_xgboost_model.joblib")
        p_pkl = Path("best_xgboost_model.pkl")
        if p_joblib.exists():
            bundle = joblib.load(p_joblib)
        elif p_pkl.exists():
            bundle = joblib.load(p_pkl)
        else:
            raise FileNotFoundError("No model file found: expected best_xgboost_model.joblib or best_xgboost_model.pkl")
    
        if isinstance(bundle, dict):
            model_obj = bundle.get("model", bundle)
            scaler = bundle.get("scaler")
            features = bundle.get("features") or []
            meta = {
                "model_type":  bundle.get("model_type", "xgboost"),
                "best_params": bundle.get("best_params", {}),
                "cv_auc":      bundle.get("cv_auc", None),
            }
        else:
            model_obj = bundle
            scaler = None
            features = []
            try:
                if hasattr(model_obj, "feature_names_in_"):
                    features = list(getattr(model_obj, "feature_names_in_"))
                else:
                    booster = getattr(model_obj, "get_booster", lambda: None)()
                    features = list(getattr(booster, "feature_names", []) or [])
            except Exception:
                features = []
            meta = {
                "model_type": getattr(model_obj, "__class__", type(model_obj)).__name__,
                "best_params": {},
                "cv_auc": None,
            }

        ml["model"] = model_obj
        ml["scaler"] = scaler
        ml["features"] = features
        ml["meta"] = meta

        logger.info(
            "Model loaded  features=%d  cv_auc=%s",
            len(ml["features"]), ml["meta"]["cv_auc"]
        )
    except FileNotFoundError:
        logger.error("model not found — run the Colab notebook first!")
        raise


@app.on_event("shutdown")
def unload_model():
    ml.clear()
    logger.info("Model released.")

class SessionFeatures(BaseModel):
    session_duration:     float = Field(..., ge=0)
    session_length:       float = Field(..., ge=0)
    unique_products:      float = Field(..., ge=0)
    cart_count:           float = Field(..., ge=0)
    view_count:           float = Field(..., ge=0)
    cart_view_ratio:      float = Field(..., ge=0)
    avg_time_gap:         float = Field(..., ge=0)
    repeat_product_views: float = Field(..., ge=0)
    unique_categories:    float = Field(..., ge=0)
    avg_price:            float = Field(..., ge=0)
    max_price:            float = Field(..., ge=0)
    price_std:            float = Field(..., ge=0)
    dayofweek:            float = Field(..., ge=0, le=6)


class PredictionResponse(BaseModel):
    will_purchase:        bool
    purchase_probability: float
    model_type:           str
    cv_auc:               Optional[float] = None


class BatchResponse(BaseModel):
    will_purchase:        bool
    purchase_probability: float

def to_dict(obj):
    return obj.model_dump() if hasattr(obj, "model_dump") else obj.dict()

@app.get("/health", tags=["Monitoring"])
def health():
    return {
        "status":     "ok",
        "model_type": ml.get("meta", {}).get("model_type"),
        "features":   len(ml.get("features", [])),
    }


@app.get("/features", tags=["Monitoring"])
def get_features():
    return {"features": ml["features"], "count": len(ml["features"])}


@app.post("/predict", response_model=PredictionResponse, tags=["Inference"])
def predict(session: SessionFeatures):
    t0 = time.perf_counter()
    try:
        df = pd.DataFrame([to_dict(session)])
        input_df = df[ml["features"]] if ml.get("features") else df
        prob     = float(ml["model"].predict_proba(input_df)[0][1])
        latency  = round((time.perf_counter() - t0) * 1000, 2)
        logger.info("predict  prob=%.4f  buy=%s  latency=%sms", prob, prob >= 0.5, latency)
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
        df = pd.DataFrame([to_dict(s) for s in sessions])
        input_df = df[ml["features"]] if ml.get("features") else df
        probs    = ml["model"].predict_proba(input_df)[:, 1]
        logger.info("batch  n=%d  avg_prob=%.4f", len(sessions), float(probs.mean()))
        return [
            BatchResponse(will_purchase=bool(p >= 0.5), purchase_probability=round(float(p), 4))
            for p in probs
        ]
    except Exception as e:
        logger.exception("batch predict failed")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
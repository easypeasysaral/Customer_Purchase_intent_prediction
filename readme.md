<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Syne&weight=700&size=28&pause=1000&color=00D4FF&center=true&vCenter=true&width=700&lines=Customer+Purchase+Intent+Predictor;Session+Behaviour+%E2%86%92+Purchase+Probability" alt="Typing SVG" />

<br/>

![Python](https://img.shields.io/badge/Python-3.10-3776AB?style=for-the-badge&logo=python&logoColor=white)
![XGBoost](https://img.shields.io/badge/XGBoost-0.9497_AUC-FF6600?style=for-the-badge&logo=xgboost&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

<br/>

**An end-to-end ML system that predicts whether an online shopper will purchase — using session behaviour alone.**

*XGBoost · RandomizedSearchCV · SHAP · FastAPI · React · 500K rows · 5-fold CV AUC 0.9497 ± 0.0014*

<br/>

[📓 Notebook](#-notebook) · [🚀 Quick Start](#-getting-started) · [📊 Results](#-results) · [🏗️ Architecture](#%EF%B8%8F-architecture)

</div>

---

## 📌 Problem Statement

Online retailers generate millions of sessions daily — but only **~3% convert to purchases**. The rest browse and leave.

This project answers: ***"Can we predict — in real time — whether this session will end in a purchase?"***

A correct prediction lets you:
- 🎯 Show targeted discounts **only** to high-intent users
- 📩 Trigger cart-abandonment nudges at the right moment
- 📉 Stop wasting retargeting budget on window shoppers

The model takes **13 session-level behavioural features** (no user history needed) and returns a purchase probability score.

---

## 🏗️ Architecture

```
Raw Event Log (view / cart / purchase)
          │
          ▼
  ┌───────────────────┐
  │   Bot Filter      │  Remove top 0.1% sessions (outliers)
  └────────┬──────────┘
           │
           ▼
  ┌───────────────────────────────────────────┐
  │   Feature Engineering  (df_feat only)     │
  │   ⚠️  view + cart events ONLY             │
  │   purchase events excluded → no leakage   │
  └────────┬──────────────────────────────────┘
           │  13 session-level features
           ▼
  ┌───────────────────┐     ┌─────────────────────┐
  │  XGBoost Classifier│────▶│  SHAP Explainability │
  │  RandomizedSearchCV│     │  Feature Impact      │
  └────────┬──────────┘     └─────────────────────┘
           │
           ▼
  ┌───────────────────┐
  │   FastAPI Server  │  /predict  /predict/batch  /health
  └────────┬──────────┘
           │
           ▼
  ┌───────────────────┐
  │   React Dashboard │  Live gauge · Buyer profile · History
  └───────────────────┘
```

---

## 🗂️ Repository Structure

```
Customer_Purchase_intent_prediction/
│
├── CustomerBehaviourAnalysis.ipynb   # EDA, feature engineering, training, evaluation
│
├── app/
│   ├── main.py                       # FastAPI server (CORS, lifespan, batch endpoint)
│   ├── model_bundle.pkl              # Trained model + scaler + feature list
│   └── requirements.txt
│
├── purchase-predictor/               # React frontend (Vite)
│   ├── src/
│   │   ├── App.jsx
│   │   └── components/
│   │       ├── FeatureForm.jsx       # 13-input form with prefill presets
│   │       ├── ResultPanel.jsx       # Gauge + buyer profile + history
│   │       └── ProbabilityGauge.jsx  # Animated SVG arc
│   └── package.json
│
└── README.md
```

---

## 🔑 Key Engineering Decisions

### ⚠️ Leakage Prevention — Most Important Design Choice

All 13 features are derived **exclusively from `view` and `cart` events**. Purchase events are used only to create the target label.

```python
# ✅ Correct — no leakage
df_feat = df[df['event_type'].isin(['view', 'cart'])].copy()
session_time['session_length'] = df_feat.groupby('user_session').size()

# ❌ Wrong — purchase events inflate session_length for buyers
session_time['session_length'] = df.groupby('user_session').size()
```

Without this fix, CV AUC was artificially `0.9997`. After fix: **`0.9497 ± 0.0014`** — a real, honest number.

### Class Imbalance Handling

~3% sessions purchase. All three models handle this explicitly:

```python
# Logistic Regression + Random Forest
class_weight='balanced'

# XGBoost
scale_pos_weight = negative_count / positive_count  # ≈ 32.3
```

### Feature Engineering

```python
df_feat = df[df['event_type'].isin(['view', 'cart'])].copy()

features = {
    'session_duration':     'max(time) - min(time) in seconds',
    'session_length':       'total view+cart event count',
    'unique_products':      'distinct products viewed/carted',
    'cart_count':           'number of cart-add events',
    'view_count':           'number of view events',
    'cart_view_ratio':      'cart_count / view_count',
    'avg_time_gap':         'mean seconds between consecutive events',
    'repeat_product_views': 'products viewed more than once',
    'unique_categories':    'distinct categories browsed',
    'avg_price':            'mean price of browsed items',
    'max_price':            'highest priced item viewed',
    'price_std':            'price variance — comparison shopping signal',
    'dayofweek':            'mode day of session (0=Mon, 6=Sun)',
}
```

---

## 📊 Results

### Model Comparison

| Model | Accuracy | Precision | Recall | F1 | ROC-AUC |
|---|---|---|---|---|---|
| Logistic Regression (tuned) | 0.8697 | 0.2748 | 0.5215 | 0.3600 | 0.8109 |
| Random Forest (tuned) | 0.9459 | 0.6278 | 0.5646 | 0.5945 | 0.9392 |
| **XGBoost (tuned)** | 0.8709 | 0.3347 | **0.8472** | 0.4798 | **0.9471** |

> **Why XGBoost as final model?**
> Highest ROC-AUC (0.9471) and recall (0.8472) — it captures the most actual buyers. In purchase intent, a missed buyer (false negative) is more costly than a false alarm.
> Random Forest has better F1 (0.5945) and precision — preferred when false positives are expensive (e.g., costly discount campaigns).

### Cross-Validation (XGBoost)

```
5-Fold Stratified CV ROC-AUC: 0.9497 ± 0.0014

Per fold:  0.9508  │  0.9486  │  0.9519  │  0.9480  │  0.9493
```

Low variance (±0.0014) confirms the model generalises — not a lucky split.

### Confusion Matrix (Test Set)

|  | Logistic Regression | Random Forest | XGBoost |
|---|---|---|---|
| True Negatives | 19,551 | 21,268 | 19,043 |
| False Positives | 2,269 | 552 | 2,777 |
| False Negatives | 789 | 718 | **252** |
| True Positives | 860 | 931 | **1,397** |

### Best Hyperparameters (XGBoost)

```python
{
    'n_estimators':     300,
    'max_depth':        6,
    'learning_rate':    0.05,
    'subsample':        0.6,
    'colsample_bytree': 1.0,
    'min_child_weight': 1,
    'gamma':            0.5,
}
```

---

## 📈 Feature Importance (SHAP + XGBoost)

| Rank | Feature | Importance | Insight |
|---|---|---|---|
| 1 | `cart_count` | ~28% | Strongest signal — cart adds → purchase |
| 2 | `session_duration` | ~16% | Longer sessions = more deliberate intent |
| 3 | `cart_view_ratio` | ~12% | Quality of engagement, not just quantity |
| 4 | `unique_products` | ~10% | Breadth of browsing |
| 5 | `view_count` | ~9% | Volume of engagement |
| 6 | `repeat_product_views` | ~8% | Returning to a product = serious interest |
| 7 | `price_std` | ~5% | Comparison shopping across price tiers |
| 8 | `dayofweek` | ~0% | Timing doesn't matter — behaviour does |

---

## 💡 Key Insights

- **Cart activity dominates.** `cart_count` alone drives 28% of the model's decisions. A single cart-add changes the probability significantly.
- **Deliberate sessions convert.** High `avg_time_gap` (user pausing to read) combined with `repeat_product_views` signals real consideration.
- **Price comparison is positive signal.** High `price_std` means the user is evaluating options across price ranges — actively shopping, not just browsing.
- **Day of week is noise.** Near-zero SHAP values — purchase intent is purely behavioural.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| ML & Analysis | Python 3.10, Scikit-learn, XGBoost, SHAP, Pandas, NumPy |
| Hyperparameter Tuning | RandomizedSearchCV (20–30 iterations, 3-fold CV, ROC-AUC scoring) |
| Backend API | FastAPI, Uvicorn, Pydantic v2, Joblib |
| Frontend | React 18, Vite, CSS Modules |
| Model Serialisation | Joblib (model + scaler + feature list bundled) |
| Notebook | Google Colab |
| Dataset | [Kaggle — Ecommerce Behavior Data](https://www.kaggle.com/datasets/mkechinov/ecommerce-behavior-data-from-multi-category-store) |

---

## 🚀 Getting Started

### Prerequisites

```bash
python --version  # 3.9+
node --version    # 18+
```

### 1. Clone

```bash
git clone https://github.com/easypeasysaral/Customer_Purchase_intent_prediction.git
cd Customer_Purchase_intent_prediction
```

### 2. Backend — FastAPI

```bash
cd app
pip install -r requirements.txt
uvicorn main:app --reload
```

- API: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`

#### Sample Request

```bash
curl -X POST "http://localhost:8000/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "session_duration": 480,
    "session_length": 22,
    "unique_products": 7,
    "cart_count": 4,
    "view_count": 15,
    "cart_view_ratio": 0.27,
    "avg_time_gap": 22.0,
    "repeat_product_views": 5,
    "unique_categories": 2,
    "avg_price": 189.99,
    "max_price": 449.0,
    "price_std": 95.4,
    "dayofweek": 6
  }'
```

#### Sample Response

```json
{
  "will_purchase": true,
  "purchase_probability": 0.8734,
  "model_type": "xgboost",
  "cv_auc": 0.9497
}
```

### 3. Frontend — React

```bash
cd purchase-predictor
npm install
npm run dev
```

Frontend: `http://localhost:5173`

> Ensure the FastAPI backend is running before starting the frontend.

### Buyer Profile Labels

The frontend maps probability to buyer profiles:

| Probability | Profile |
|---|---|
| ≥ 85% | 🛒 Serious Buyer |
| 65–85% | 💳 Cart Abandoner |
| 45–65% | ⚖️ Edge Case |
| 25–45% | 🔍 Price Researcher |
| 10–25% | 🪟 Window Shopper |
| < 10% | 💨 Quick Bouncer |

---

## 📓 Notebook

The notebook (`CustomerBehaviourAnalysis.ipynb`) covers:

1. **Data loading** — 500K rows, memory optimisation via dtype downcasting
2. **EDA** — event distribution, conversion funnel (~3% purchase rate), hourly patterns
3. **Bot filtering** — 99.9th percentile session removal
4. **Feature engineering** — 13 features, view+cart events only (leakage-free)
5. **Modelling** — LR, RF, XGBoost with RandomizedSearchCV
6. **Evaluation** — confusion matrices, ROC curves, PR curves, 5-fold CV
7. **SHAP** — directional feature impact analysis
8. **Export** — `model_bundle.pkl` with model, scaler, feature list, best params

---

## 🔮 Future Improvements

- [ ] Add user-level features (return visitor history, past purchase rate)
- [ ] Experiment with LightGBM and CatBoost baselines
- [ ] Threshold tuning — optimise precision/recall trade-off per business objective
- [ ] Dockerise full stack for one-command deployment
- [ ] Add prediction drift monitoring for production

---

## 👤 Author

**Saral** — B.Tech CSE (AI & ML), 2026

[![GitHub](https://img.shields.io/badge/GitHub-easypeasysaral-181717?style=flat&logo=github)](https://github.com/easypeasysaral)

---

## 📄 License

This project is open source under the [MIT License](LICENSE).
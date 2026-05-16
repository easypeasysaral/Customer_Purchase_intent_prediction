# 🛒 Customer Purchase Intent Prediction

An end-to-end machine learning system that predicts whether an online shopper will make a purchase based on their session behaviour. Includes a trained **XGBoost model** (ROC-AUC **0.9497 ± 0.0014** on 5-fold CV), a **FastAPI** prediction backend, and a **Next.js** frontend — fully deployable as a web application.

---

## 📌 Project Overview

Online retailers generate large amounts of session data but struggle to identify which visitors are likely to convert. This project builds a binary classification pipeline that takes session-level behavioural features and returns a purchase probability — enabling real-time, targeted interventions like personalised offers or re-engagement nudges.

---

## 🗂️ Repository Structure

```
Customer_Purchase_intent_prediction/
│
├── CustomerBehaviourAnalysis.ipynb   # EDA, feature engineering, model training & evaluation
│
├── app/               # FastAPI backend
│   ├── main.py                       # API endpoints
│   ├── model/                        # Saved XGBoost model (.pkl / .joblib)
│   └── requirements.txt
│
├── purchase-predictor/                              # Next.js frontend
│   ├── page.js / page.tsx            # Main prediction UI
│   ├── components/
│   └── ...
│
└── .gitignore
```

---

## 🧠 Models Trained

Three classifiers were trained and tuned using `RandomizedSearchCV`:

| Model | Accuracy | Precision | Recall | F1 | ROC-AUC |
|---|---|---|---|---|---|
| Logistic Regression (tuned) | 0.8697 | 0.2748 | 0.5215 | 0.3600 | 0.8109 |
| Random Forest (tuned) | 0.9459 | 0.6278 | 0.5646 | 0.5945 | 0.9392 |
| **XGBoost (tuned)** | **0.8709** | **0.3347** | **0.8472** | **0.4798** | **0.9471** |

> **XGBoost** was selected as the final model — it achieves the highest ROC-AUC (0.9471) and the best recall (0.8472), meaning it captures the most actual buyers. In purchase intent scenarios, missing a real buyer is more costly than a false positive.

### Cross-Validation (XGBoost)

```
5-Fold CV ROC-AUC: 0.9497 ± 0.0014
Per-fold: [0.9508, 0.9486, 0.9519, 0.9480, 0.9493]
```

Low variance across folds confirms the model generalises well and is not overfitting.

---

## 🔑 Best Hyperparameters

```python
# XGBoost (final model)
{
  'subsample': 0.6,
  'n_estimators': 300,
  'min_child_weight': 1,
  'max_depth': 6,
  'learning_rate': 0.05,
  'gamma': 0.5,
  'colsample_bytree': 1.0
}
```

---

## 📊 Feature Importance

Top predictors from XGBoost feature importance and SHAP analysis:

| Rank | Feature | Importance |
|---|---|---|
| 1 | `cart_count` | ~28% — strongest signal by far |
| 2 | `session_duration` | ~16% |
| 3 | `cart_view_ratio` | ~12% |
| 4 | `unique_products` | ~10% |
| 5 | `view_count` | ~9% |
| 6 | `repeat_product_views` | ~8% |
| 7 | `price_std` | ~5% |

SHAP analysis confirms that longer session durations push predictions toward purchase, while short sessions with high average time gaps reduce purchase probability. `dayofweek` has near-zero importance — intent is driven by behaviour, not timing.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| ML & Analysis | Python, Scikit-learn, XGBoost, SHAP, Pandas |
| Backend API | FastAPI, Uvicorn, Pydantic |
| Frontend | Next.js, JavaScript, CSS |
| Model Serialisation | Joblib / Pickle |
| Notebook | Google Colab |
| Version Control | Git, GitHub |

---

## 🚀 Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+

---

### 1. Clone the repository

```bash
git clone https://github.com/easypeasysaral/Customer_Purchase_intent_prediction.git
cd Customer_Purchase_intent_prediction
```

---

### 2. Run the FastAPI backend

```bash
cd purchase-predictor
pip install -r requirements.txt
uvicorn main:app --reload
```

API available at `http://localhost:8000`  
Swagger UI (interactive docs) at `http://localhost:8000/docs`

#### Sample API request

```bash
curl -X POST "http://localhost:8000/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "cart_count": 3,
    "session_duration": 420,
    "cart_view_ratio": 0.6,
    "unique_products": 5,
    "view_count": 12,
    "repeat_product_views": 2,
    "price_std": 150.0,
    "session_length": 8,
    "avg_time_gap": 35.0,
    "max_price": 499.0,
    "avg_price": 220.0,
    "unique_categories": 3,
    "dayofweek": 2
  }'
```

#### Sample response

```json
{
  "prediction": 1,
  "purchase_probability": 0.87,
  "label": "Likely to Purchase"
}
```

---

### 3. Run the Next.js frontend

```bash
cd app
npm install
npm run dev
```

Frontend available at `http://localhost:3000`

> Make sure the FastAPI backend is running before starting the frontend.

---

### 4. Reproduce the model

Open `CustomerBehaviourAnalysis.ipynb` in Jupyter or Google Colab to reproduce the full EDA, feature engineering, model training, and evaluation pipeline.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/drive/1QI1eyiGfx6cw2o-QuuaOcZQ3K7zTHLjs)

---

## 📈 Results Summary

### Confusion Matrices (Test Set)

|  | Logistic Regression | Random Forest | XGBoost |
|---|---|---|---|
| True Negatives | 19,551 | 21,268 | 19,043 |
| False Positives | 2,269 | 552 | 2,777 |
| False Negatives | 789 | 718 | **252** |
| True Positives | 860 | 931 | **1,397** |

XGBoost captures the most actual buyers (1,397 TP) with the fewest missed buyers (252 FN) — the right trade-off for a purchase intent use case.

### ROC-AUC & Precision-Recall

| Model | ROC-AUC | Avg Precision (PR curve) |
|---|---|---|
| Logistic Regression | 0.811 | 0.322 |
| Random Forest | 0.939 | 0.668 |
| **XGBoost** | **0.947** | **0.701** |

---

## 💡 Key Insights

- **Cart activity is king.** `cart_count` accounts for ~28% of XGBoost's feature importance — a user adding items to cart is the strongest purchase signal.
- **Session depth matters.** `session_duration`, `cart_view_ratio`, and `repeat_product_views` together confirm that engaged, deliberate sessions signal intent.
- **Price range browsing is informative.** High `price_std` indicates comparison shopping across price tiers — a behaviour associated with serious buying intent.
- **Day of week is irrelevant.** `dayofweek` has near-zero importance, confirming purchase intent is driven by what users do, not when they visit.

---

## 🔮 Future Improvements

- Add user-level features (return visitor history, past purchase count)
- Experiment with LightGBM and neural network baselines
- Threshold tuning to optimise the precision/recall trade-off for specific business goals
- Dockerise the full stack for one-command deployment
- Add monitoring for live prediction drift detection

---

## 👤 Author

**Saral** — [GitHub](https://github.com/easypeasysaral)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
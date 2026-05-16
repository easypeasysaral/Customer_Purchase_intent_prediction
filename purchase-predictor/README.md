# Purchase Intent Predictor — Frontend

React + Vite frontend for the Customer Behaviour Analysis FastAPI server.

## Folder Structure

```
purchase-predictor/
├── index.html
├── vite.config.js
├── package.json
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── App.module.css
│   ├── index.css
│   └── components/
│       ├── ProblemStatement.jsx
│       ├── ProblemStatement.module.css
│       ├── FeatureForm.jsx
│       ├── FeatureForm.module.css
│       ├── ResultPanel.jsx
│       ├── ResultPanel.module.css
│       ├── ProbabilityGauge.jsx
│       └── ProbabilityGauge.module.css
```

## Setup Steps

### Step 1 — Prerequisites
```bash
node --version   # need v18+
npm --version    # need v9+
```

If Node not installed: https://nodejs.org

---

### Step 2 — Install dependencies
```bash
cd purchase-predictor
npm install
```

---

### Step 3 — Start FastAPI backend first
```bash
# In a separate terminal, in the folder with main.py + model_bundle.pkl
pip install fastapi uvicorn xgboost scikit-learn pandas joblib
uvicorn main:app --reload
# Server runs at http://127.0.0.1:8000
# Swagger docs at http://127.0.0.1:8000/docs
```

---

### Step 4 — Start React frontend
```bash
npm run dev
# Opens at http://localhost:5173
```

---

### Step 5 — Use the app
1. Open http://localhost:5173
2. Check the top-right status badge — should show **api online** (green dot)
3. Click **↑ High Intent** to prefill a sample
4. Click **⚡ Predict Purchase Intent**
5. See the probability gauge + verdict animate in

---

## Build for Production
```bash
npm run build        # outputs to dist/
npm run preview      # preview the production build locally
```

To deploy: copy the `dist/` folder to any static host (Vercel, Netlify, GitHub Pages).

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Status badge shows "api offline" | Make sure `uvicorn main:app --reload` is running |
| CORS error in browser console | Check main.py has CORSMiddleware — use the updated main.py |
| `npm install` fails | Delete `node_modules/` and run again |
| Port 5173 busy | `npm run dev -- --port 3000` |
| model_bundle.pkl not found | Run the Colab notebook fully and download the pkl |

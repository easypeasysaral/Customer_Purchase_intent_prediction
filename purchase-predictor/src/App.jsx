import { useState, useEffect, useCallback } from 'react'
import ProblemStatement from './components/ProblemStatement'
import FeatureForm      from './components/FeatureForm'
import ResultPanel      from './components/ResultPanel'
import styles           from './App.module.css'

const EMPTY_FORM = {
  session_duration: '', session_length: '', unique_products: '',
  cart_count: '', view_count: '', cart_view_ratio: '',
  avg_time_gap: '', repeat_product_views: '', unique_categories: '',
  avg_price: '', max_price: '', price_std: '', dayofweek: '',
}

const FEATURE_KEYS = Object.keys(EMPTY_FORM)

export default function App() {
  const [values,  setValues]  = useState(EMPTY_FORM)
  const [apiUrl,  setApiUrl]  = useState('http://127.0.0.1:8000')
  const [status,  setStatus]  = useState('checking')   // 'online' | 'offline' | 'checking'
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null)
  const [payload, setPayload] = useState(null)
  const [error,   setError]   = useState(null)
  const [history, setHistory] = useState([])

  /* ── Health check ────────────────────────────────────────────────────── */
  const checkHealth = useCallback(async () => {
    setStatus('checking')
    try {
      const r = await fetch(`${apiUrl.replace(/\/$/, '')}/health`, {
        signal: AbortSignal.timeout(3000),
      })
      setStatus(r.ok ? 'online' : 'offline')
    } catch {
      setStatus('offline')
    }
  }, [apiUrl])

  useEffect(() => { checkHealth() }, [checkHealth])
  useEffect(() => {
    const id = setInterval(checkHealth, 30_000)
    return () => clearInterval(id)
  }, [checkHealth])

  /* ── Form change handler ─────────────────────────────────────────────── */
  const handleChange = useCallback((id, val) => {
    setValues(prev => ({ ...prev, [id]: val }))
    setError(null)
  }, [])

  /* ── Predict ─────────────────────────────────────────────────────────── */
  const handlePredict = useCallback(async () => {
    // Validate all fields filled
    const missing = FEATURE_KEYS.filter(k => values[k] === '' || values[k] === null)
    if (missing.length) {
      setError(`Missing: ${missing.join(', ')}`)
      return
    }

    const body = {}
    for (const k of FEATURE_KEYS) body[k] = parseFloat(values[k])

    setLoading(true)
    setError(null)

    try {
      const r = await fetch(`${apiUrl.replace(/\/$/, '')}/predict`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })

      if (!r.ok) {
        const txt = await r.text()
        throw new Error(`HTTP ${r.status}: ${txt}`)
      }

      const data = await r.json()
      setResult(data)
      setPayload(body)

      // Add to history (max 8 entries)
      const now = new Date()
      const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      setHistory(prev => [
        ...prev.slice(-7),
        { ...data, time },
      ])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [values, apiUrl])

  /* ── Status badge ────────────────────────────────────────────────────── */
  const statusMeta = {
    online:   { dot: styles.dotOnline,   label: 'api online' },
    offline:  { dot: styles.dotOffline,  label: 'api offline' },
    checking: { dot: styles.dotChecking, label: 'checking api...' },
  }[status]

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <div className={styles.page}>
      <div className={styles.wrap}>

        {/* ── Header ───────────────────────────────────────────────────── */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={`${styles.tag} mono`}>
              <span className={styles.tagDot} />
              ML INFERENCE API
            </div>
            <h1 className={`${styles.h1} syne`}>
              Purchase <span className={styles.accent}>Intent</span> Predictor
            </h1>
            <p className={styles.headSub}>
              Session-level XGBoost classifier · 13 behavioural features
            </p>
          </div>

          <div className={styles.statusBadge} onClick={checkHealth} title="Click to recheck">
            <span className={`${styles.statusDot} ${statusMeta.dot}`} />
            <span className={`${styles.statusLabel} mono`}>{statusMeta.label}</span>
          </div>
        </header>

        {/* ── Problem Statement ─────────────────────────────────────────── */}
        <ProblemStatement />

        {/* ── Main two-column layout ────────────────────────────────────── */}
        <div className={styles.grid}>
          {/* Left — form */}
          <div className={`${styles.col} fade-up`} style={{ animationDelay: '0.05s' }}>
            <FeatureForm
              values={values}
              onChange={handleChange}
              onPredict={handlePredict}
              loading={loading}
              apiUrl={apiUrl}
              onApiUrlChange={setApiUrl}
            />
            {error && (
              <div className={`${styles.errorBox} mono`}>
                ⚠ {error}
              </div>
            )}
          </div>

          {/* Right — results */}
          <div className={`${styles.col} fade-up`} style={{ animationDelay: '0.12s' }}>
            <ResultPanel
              result={result}
              payload={payload}
              history={history}
            />
          </div>
        </div>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <footer className={styles.footer}>
          <span className="mono" style={{ fontSize: 11, color: 'var(--text3)' }}>
            Customer Behaviour Analysis · XGBoost + FastAPI + React
          </span>
        </footer>
      </div>
    </div>
  )
}

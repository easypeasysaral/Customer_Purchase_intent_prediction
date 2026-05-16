import { useEffect, useRef } from 'react'
import ProbabilityGauge from './ProbabilityGauge'
import styles from './ResultPanel.module.css'

const SIGNAL_CONFIG = [
  { key: 'cart_count',           label: 'Cart Count',      max: 5,   color: 'var(--cyan)'   },
  { key: 'cart_view_ratio',      label: 'Cart/View Ratio', max: 1,   color: 'var(--cyan)'   },
  { key: 'repeat_product_views', label: 'Repeat Views',    max: 5,   color: 'var(--orange)' },
  { key: 'avg_price',            label: 'Avg Price',       max: 500, color: 'var(--orange)' },
  { key: 'session_duration',     label: 'Duration',        max: 600, color: 'var(--green)'  },
  { key: 'session_length',       label: 'Events',          max: 30,  color: 'var(--green)'  },
]

function getBuyerProfile(prob) {
  if (prob >= 0.85) return {
    icon: '🛒', title: 'Serious Buyer',
    desc: 'High cart adds, long session — bahut zyada purchase intent',
    style: 'buy',
  }
  if (prob >= 0.65) return {
    icon: '💳', title: 'Cart Abandoner',
    desc: 'Cart mein items daale lekin session khatam — nudge bhejo',
    style: 'buy',
  }
  if (prob >= 0.45) return {
    icon: '⚖️', title: 'Edge Case',
    desc: 'Borderline session — dono taraf ja sakta hai',
    style: 'edge',
  }
  if (prob >= 0.25) return {
    icon: '🔍', title: 'Price Researcher',
    desc: 'Options compare kar raha hai — abhi kharidne ka mood nahi',
    style: 'nobuy',
  }
  if (prob >= 0.10) return {
    icon: '🪟', title: 'Window Shopper',
    desc: 'Casual browsing, kai categories — low purchase intent',
    style: 'nobuy',
  }
  return {
    icon: '💨', title: 'Quick Bouncer',
    desc: 'Bahut short session — accidental click ya bot',
    style: 'nobuy',
  }
}

function BarRow({ label, value, max, color, visible }) {
  const barRef = useRef(null)
  const pct    = Math.min(Math.round((value / max) * 100), 100)

  useEffect(() => {
    if (!barRef.current) return
    const t = setTimeout(() => {
      if (barRef.current) barRef.current.style.width = visible ? `${pct}%` : '0%'
    }, 80)
    return () => clearTimeout(t)
  }, [pct, visible])

  return (
    <div className={styles.barRow}>
      <span className={styles.barName}>{label}</span>
      <div className={styles.barTrack}>
        <div ref={barRef} className={styles.barFill} style={{ width: '0%', background: color }} />
      </div>
      <span className={`${styles.barPct} mono`}>{pct}%</span>
    </div>
  )
}

export default function ResultPanel({ result, payload, history }) {
  const hasResult = result !== null

  return (
    <div className={styles.wrap}>

      <div className={styles.card}>
        {!hasResult ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📊</div>
            <p className={styles.emptyText}>Fill session features<br />and click Predict</p>
          </div>
        ) : (
          <div className="scale-in">
            <ProbabilityGauge probability={result.purchase_probability} />

            {(() => {
              const profile = getBuyerProfile(result.purchase_probability)
              const pct     = Math.round(result.purchase_probability * 100)
              return (
                <div className={`${styles.verdict} ${styles[profile.style]}`}>
                  <span className={styles.verdictIcon}>{profile.icon}</span>
                  <div>
                    <p className={`${styles.verdictTitle} syne`}>{profile.title}</p>
                    <p className={styles.verdictDesc}>{pct}% probability · {profile.desc}</p>
                  </div>
                </div>
              )
            })()}

            {payload && (
              <div className={styles.bars}>
                <p className={`${styles.barsTitle} mono`}>INPUT SIGNAL STRENGTH</p>
                {SIGNAL_CONFIG.map(s => (
                  <BarRow key={s.key} label={s.label} value={payload[s.key] ?? 0}
                    max={s.max} color={s.color} visible={hasResult} />
                ))}
              </div>
            )}

            <div className={styles.meta}>
              <div className={styles.metaItem}>
                <span className={`${styles.metaLabel} mono`}>MODEL</span>
                <span className={`${styles.metaVal} mono`}>{result.model_type ?? 'xgboost'}</span>
              </div>
              {result.cv_auc && (
                <div className={styles.metaItem}>
                  <span className={`${styles.metaLabel} mono`}>CV AUC</span>
                  <span className={`${styles.metaVal} mono`}>{result.cv_auc}</span>
                </div>
              )}
              <div className={styles.metaItem}>
                <span className={`${styles.metaLabel} mono`}>THRESHOLD</span>
                <span className={`${styles.metaVal} mono`}>0.50</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className={styles.histCard}>
          <p className={`${styles.histTitle} mono`}>PREDICTION HISTORY</p>
          {history.slice().reverse().map((h, i) => {
            const profile = getBuyerProfile(h.purchase_probability)
            return (
              <div key={i} className={styles.histRow}>
                <span className={`${styles.histBadge} ${
                  profile.style === 'buy'  ? styles.histBuy  :
                  profile.style === 'edge' ? styles.histEdge :
                  styles.histNoBuy
                } mono`}>
                  {profile.icon} {profile.title}
                </span>
                <span className={`${styles.histProb} mono`}>
                  {Math.round(h.purchase_probability * 100)}%
                </span>
                <span className={styles.histTime}>{h.time}</span>
              </div>
            )
          })}
        </div>
      )}

      <div className={styles.apiCard}>
        <p className={`${styles.apiTitle} mono`}>API ENDPOINTS</p>
        {[
          { method: 'GET',  path: '/health',        color: 'var(--green)' },
          { method: 'GET',  path: '/features',      color: 'var(--green)' },
          { method: 'POST', path: '/predict',       color: 'var(--cyan)'  },
          { method: 'POST', path: '/predict/batch', color: 'var(--cyan)'  },
        ].map(ep => (
          <div key={ep.path} className={styles.endpoint}>
            <span className={`${styles.method} mono`} style={{ color: ep.color, borderColor: ep.color }}>
              {ep.method}
            </span>
            <span className={`${styles.path} mono`}>{ep.path}</span>
          </div>
        ))}
        <div className={styles.runCmd}>
          <span className={`${styles.runLabel} mono`}>$ </span>
          <span className={`${styles.runText} mono`}>uvicorn main:app --reload</span>
        </div>
      </div>

    </div>
  )
}

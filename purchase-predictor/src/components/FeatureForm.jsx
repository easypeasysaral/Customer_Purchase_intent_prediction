import styles from './FeatureForm.module.css'

/* ── Sample presets ─────────────────────────────────────────────────────── */
const SAMPLES = {
  high: {
    session_duration: 480, session_length: 22, unique_products: 7,
    cart_count: 4, view_count: 15, cart_view_ratio: 0.27,
    avg_time_gap: 22, repeat_product_views: 5, unique_categories: 2,
    avg_price: 189.99, max_price: 449, price_std: 95.4, dayofweek: 6,
  },
  medium: {
    session_duration: 185, session_length: 11, unique_products: 5,
    cart_count: 1, view_count: 9, cart_view_ratio: 0.11,
    avg_time_gap: 18, repeat_product_views: 2, unique_categories: 3,
    avg_price: 89.99, max_price: 199, price_std: 45.2, dayofweek: 4,
  },
  low: {
    session_duration: 35, session_length: 4, unique_products: 4,
    cart_count: 0, view_count: 4, cart_view_ratio: 0,
    avg_time_gap: 8, repeat_product_views: 0, unique_categories: 4,
    avg_price: 24.99, max_price: 49, price_std: 12.1, dayofweek: 2,
  },
}

/* ── Field groups ───────────────────────────────────────────────────────── */
const GROUPS = [
  {
    label: 'SESSION BASICS',
    fields: [
      { id: 'session_duration',     label: 'Session Duration',  unit: 'sec',      step: 1,    min: 0 },
      { id: 'session_length',       label: 'Session Length',    unit: 'events',   step: 1,    min: 0 },
      { id: 'unique_products',      label: 'Unique Products',   unit: 'count',    step: 1,    min: 0 },
    ],
  },
  {
    label: 'EVENT COUNTS',
    fields: [
      { id: 'cart_count',           label: 'Cart Count',        unit: 'adds',     step: 1,    min: 0 },
      { id: 'view_count',           label: 'View Count',        unit: 'views',    step: 1,    min: 0 },
      { id: 'cart_view_ratio',      label: 'Cart/View Ratio',   unit: '0–1',      step: 0.01, min: 0, max: 10 },
    ],
  },
  {
    label: 'BEHAVIOURAL SIGNALS',
    fields: [
      { id: 'avg_time_gap',         label: 'Avg Time Gap',      unit: 'sec',      step: 0.1,  min: 0 },
      { id: 'repeat_product_views', label: 'Repeat Views',      unit: 'products', step: 1,    min: 0 },
      { id: 'unique_categories',    label: 'Unique Categories', unit: 'count',    step: 1,    min: 0 },
    ],
  },
  {
    label: 'PRICE SIGNALS',
    fields: [
      { id: 'avg_price',            label: 'Avg Price',         unit: 'USD',      step: 0.01, min: 0 },
      { id: 'max_price',            label: 'Max Price',         unit: 'USD',      step: 0.01, min: 0 },
      { id: 'price_std',            label: 'Price Std Dev',     unit: 'USD',      step: 0.01, min: 0 },
    ],
  },
  {
    label: 'TEMPORAL',
    fields: [
      { id: 'dayofweek',            label: 'Day of Week',       unit: '0=Mon 6=Sun', step: 1, min: 0, max: 6 },
    ],
  },
]

/* ── Field component ────────────────────────────────────────────────────── */
function Field({ id, label, unit, step, min, max, value, onChange }) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
        <span className={`${styles.unit} mono`}>{unit}</span>
      </label>
      <input
        id={id}
        className={`${styles.input} mono`}
        type="number"
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(id, e.target.value)}
        placeholder="0"
      />
    </div>
  )
}

/* ── Main component ─────────────────────────────────────────────────────── */
export default function FeatureForm({ values, onChange, onPredict, loading, apiUrl, onApiUrlChange }) {
  const fill  = preset => Object.entries(SAMPLES[preset]).forEach(([k, v]) => onChange(k, v))
  const clear = ()      => Object.keys(SAMPLES.high).forEach(k => onChange(k, ''))

  return (
    <div className={styles.card}>
      {/* Card header */}
      <div className={styles.header}>
        <div>
          <p className={`${styles.title} syne`}>Session Features</p>
          <p className={styles.sub}>13 behavioural signals → purchase probability</p>
        </div>
      </div>

      <div className={styles.body}>
        {/* Prefill buttons */}
        <div className={styles.presets}>
          <span className={`${styles.presetLabel} mono`}>PREFILL:</span>
          <button className={`${styles.presetBtn} ${styles.high}`} onClick={() => fill('high')}>
            ↑ High Intent
          </button>
          <button className={`${styles.presetBtn} ${styles.med}`} onClick={() => fill('medium')}>
            ◆ Medium
          </button>
          <button className={`${styles.presetBtn} ${styles.low}`} onClick={() => fill('low')}>
            ↓ Low Intent
          </button>
          <button className={`${styles.presetBtn} ${styles.clear}`} onClick={clear}>
            ✕ Clear
          </button>
        </div>

        {/* Feature groups */}
        {GROUPS.map(group => (
          <div key={group.label} className={styles.group}>
            <div className={`${styles.groupLabel} mono`}>{group.label}</div>
            <div className={styles.grid}>
              {group.fields.map(f => (
                <Field
                  key={f.id}
                  {...f}
                  value={values[f.id] ?? ''}
                  onChange={onChange}
                />
              ))}
            </div>
          </div>
        ))}

        {/* API URL */}
        <div className={styles.apiRow}>
          <span className={`${styles.apiLabel} mono`}>API</span>
          <input
            className={`${styles.apiInput} mono`}
            value={apiUrl}
            onChange={e => onApiUrlChange(e.target.value)}
            placeholder="http://127.0.0.1:8000"
            spellCheck={false}
          />
        </div>

        {/* Submit */}
        <button
          className={styles.predictBtn}
          onClick={onPredict}
          disabled={loading}
        >
          {loading
            ? <><span className={styles.spinner} /> Predicting...</>
            : '⚡ Predict Purchase Intent'
          }
        </button>
      </div>
    </div>
  )
}

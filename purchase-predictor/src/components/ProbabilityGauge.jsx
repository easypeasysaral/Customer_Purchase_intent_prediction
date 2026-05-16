import { useEffect, useRef } from 'react'
import styles from './ProbabilityGauge.module.css'

const TOTAL_ARC = 220  // px length of the half-circle arc path

export default function ProbabilityGauge({ probability }) {
  const arcRef    = useRef(null)
  const needleRef = useRef(null)

  useEffect(() => {
    if (probability == null) return

    const offset = TOTAL_ARC - TOTAL_ARC * probability

    // Animate arc stroke
    if (arcRef.current) {
      arcRef.current.style.strokeDashoffset = offset
    }

    // Animate needle position along the arc
    if (needleRef.current) {
      const angle  = -180 + 180 * probability   // -180° (left) to 0° (right)
      const rad    = (angle * Math.PI) / 180
      const cx     = 90 + 70 * Math.cos(rad)
      const cy     = 100 + 70 * Math.sin(rad)
      needleRef.current.setAttribute('cx', cx)
      needleRef.current.setAttribute('cy', cy)
      needleRef.current.style.opacity = '1'
    }
  }, [probability])

  const pct   = probability != null ? Math.round(probability * 100) : null
  const color = probability == null ? 'var(--text3)'
              : probability >= 0.6  ? 'var(--green)'
              : probability >= 0.4  ? 'var(--amber)'
              : 'var(--red)'

  return (
    <div className={styles.wrap}>
      <p className={`${styles.label} mono`}>PURCHASE PROBABILITY</p>

      <div className={styles.svgWrap}>
        <svg width="180" height="110" viewBox="0 0 180 110" className={styles.svg}>
          <defs>
            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#FF4444" />
              <stop offset="50%"  stopColor="#FFB300" />
              <stop offset="100%" stopColor="#00E676" />
            </linearGradient>
          </defs>

          {/* Background track */}
          <path
            d="M 20 100 A 70 70 0 0 1 160 100"
            fill="none"
            stroke="var(--border2)"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Coloured progress arc */}
          <path
            ref={arcRef}
            d="M 20 100 A 70 70 0 0 1 160 100"
            fill="none"
            stroke="url(#gaugeGrad)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={TOTAL_ARC}
            strokeDashoffset={TOTAL_ARC}
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
          />

          {/* Needle dot */}
          <circle
            ref={needleRef}
            cx="20" cy="100" r="6"
            fill={color}
            opacity="0"
            style={{ transition: 'cx 1.2s cubic-bezier(0.4,0,0.2,1), cy 1.2s cubic-bezier(0.4,0,0.2,1), opacity 0.4s' }}
          />
        </svg>

        {/* Centre value */}
        <div className={styles.value}>
          <span className={`${styles.num} syne`} style={{ color }}>
            {pct != null ? `${pct}%` : '—'}
          </span>
          <span className={`${styles.pctLabel} mono`}>probability</span>
        </div>
      </div>
    </div>
  )
}

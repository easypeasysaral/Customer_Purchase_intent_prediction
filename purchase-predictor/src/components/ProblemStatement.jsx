import { useState } from 'react'
import styles from './ProblemStatement.module.css'

const CARDS = [
  {
    label: 'PROBLEM',
    text: 'Ek ecommerce site pe lakhs sessions hoti hain roz. Inme se sirf ~3% sessions purchase karti hain. Baaki sab browse karke chali jaati hain.',
  },
  {
    label: 'GOAL',
    text: 'Predict karo — kya yeh session purchase mein convert hogi? Real-time, sirf session behaviour dekh ke.',
    highlight: true,
  },
  {
    label: 'BUSINESS VALUE',
    text: 'High-intent users ko targeted discount do. Low-intent users ko retargeting ad dikhao. Conversion rate improve karo without wasting budget.',
  },
  {
    label: 'APPROACH',
    text: 'Raw event data → session-level aggregation → 13 features → XGBoost classifier → probability score → FastAPI → React UI.',
  },
]

export default function ProblemStatement() {
  const [open, setOpen] = useState(true)

  return (
    <div className={styles.card}>
      {/* Header — clickable toggle */}
      <div className={styles.header} onClick={() => setOpen(o => !o)}>
        <div className={styles.headerLeft}>
          <div className={styles.icon}>🎯</div>
          <div>
            <p className={`${styles.title} syne`}>Problem Statement</p>
            <p className={styles.sub}>Use case · Architecture · Hinglish explanation</p>
          </div>
        </div>
        <span className={`${styles.chevron} ${open ? styles.open : ''}`}>▼</span>
      </div>

      {/* Collapsible body */}
      <div className={`${styles.body} ${open ? styles.bodyOpen : ''}`}>
        <div className={styles.grid}>
          {CARDS.map(c => (
            <div key={c.label} className={`${styles.item} ${c.highlight ? styles.itemHighlight : ''}`}>
              <p className={`${styles.itemLabel} mono`}>{c.label}</p>
              <p className={styles.itemText}>{c.text}</p>
            </div>
          ))}
        </div>

        {/* Hinglish block */}
        <div className={styles.hinglish}>
          <p className={`${styles.hinglishLabel} mono`}>HINGLISH MEIN SAMJHO</p>
          <p className={styles.hinglishText}>
            Socho tumhare paas ek dukaan hai online. Har din hazaaron log aate hain —
            kuch sirf dekhte hain, kuch khareedte hain. Tum kaise jaanoge{' '}
            <em>pehle hi</em> ki kaunsa banda kharidega?{' '}
            <strong>Yahi kaam yeh model karta hai.</strong>
          </p>
          <p className={styles.hinglishText} style={{ marginTop: 10 }}>
            Jab koi user website pe aata hai, uski <strong>session ki baatein</strong> track
            hoti hain — kitne products dekhe, kitne cart mein daale, kitni der ruka, kaunsi
            price range browse ki. Yeh sab data ek ML model ko dete hain aur woh batata hai:{' '}
            <strong style={{ color: 'var(--cyan)' }}>
              "Is banda ke purchase karne ki 73% probability hai."
            </strong>
          </p>
          <p className={styles.hinglishText} style={{ marginTop: 10 }}>
            Kyun zaroori hai? Kyunki agar model sahi predict kar sakta hai toh tum{' '}
            <strong>sahi waqt pe sahi offer de sakte ho</strong> — sirf unhe jo actually
            khareedne wale hain. Baaki pe paise waste mat karo.
          </p>
        </div>

        {/* Architecture mini-flow */}
        <div className={styles.flow}>
          {[
            'Raw Events',
            'Bot Filter',
            'Feature Eng.',
            'XGBoost',
            'FastAPI',
            'React UI',
          ].map((step, i, arr) => (
            <div key={step} className={styles.flowItem}>
              <div className={styles.flowBox}>
                <span className={`${styles.flowText} mono`}>{step}</span>
              </div>
              {i < arr.length - 1 && <span className={styles.flowArrow}>→</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

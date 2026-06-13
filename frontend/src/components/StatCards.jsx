import { motion } from 'framer-motion'
import { Activity, AlertTriangle, ShieldCheck, Brain } from 'lucide-react'
import useCountUp from '../hooks/useCountUp'
import { CATEGORY_COLORS } from '../lib/colors'
import { useReady } from '../lib/readyContext'

// Mini SVG sparkline
function Sparkline({ data, color }) {
  const max = Math.max(...data)
  const w = 56, h = 24
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - (v / max) * (h - 2) - 1
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  const lastX = w
  const lastY = h - (data[data.length - 1] / max) * (h - 2) - 1
  return (
    <svg width={w} height={h} style={{ display: 'block', overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5}
        strokeLinecap="round" strokeLinejoin="round" opacity={0.6} />
      <circle cx={lastX} cy={lastY} r={2} fill={color} opacity={0.9} />
    </svg>
  )
}

const sparkWeek = [28, 41, 35, 62, 44, 51, 347]

const cards = [
  {
    label: 'Total Traffic',    target: 12480, decimals: 0, suffix: '',
    color: '#e2e2e2', icon: Activity, sub: '+5.2% today',
    spark: null,
  },
  {
    label: 'Attacks Detected', target: 347,   decimals: 0, suffix: '',
    color: CATEGORY_COLORS.DoS, icon: AlertTriangle, sub: 'Last 7 days',
    spark: sparkWeek,
  },
  {
    label: 'Normal Traffic',   target: 12133, decimals: 0, suffix: '',
    color: CATEGORY_COLORS.Normal, icon: ShieldCheck, sub: '97.2% of total',
    spark: null,
  },
  {
    label: 'Model Confidence', target: 98.4,  decimals: 1, suffix: '%',
    color: '#3b82f6', icon: Brain, sub: 'XGBoost · 41 features',
    spark: null,
  },
]

function StatCard({ label, target, decimals, suffix, color, icon: Icon, sub, spark, delay }) {
  const ready = useReady()
  const value = useCountUp(ready ? target : 0, 1500, decimals)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      whileHover={{ y: -2, borderColor: '#2a2a2a' }}
      style={{
        background: '#161616',
        border: '1px solid #1f1f1f',
        borderRadius: 8,
        padding: '16px 18px',
        cursor: 'default',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: '#555' }}>{label}</span>
        <motion.div whileHover={{ rotate: 10, scale: 1.15 }} transition={{ type: 'spring', stiffness: 300 }}>
          <Icon size={15} color="#333" />
        </motion.div>
      </div>

      <div style={{ fontSize: 28, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.5px', lineHeight: 1 }}>
        {decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString()}{suffix}
      </div>

      {/* Sub row — sparkline for attacks card, plain text otherwise */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
        <span style={{ fontSize: 11, color: '#444' }}>{sub}</span>
        {spark && <Sparkline data={spark} color={color} />}
      </div>
    </motion.div>
  )
}

export default function StatCards() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
      {cards.map((c, i) => <StatCard key={c.label} {...c} delay={i * 0.08} />)}
    </div>
  )
}

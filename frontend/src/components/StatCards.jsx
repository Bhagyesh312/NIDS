import { motion } from 'framer-motion'
import { Activity, AlertTriangle, ShieldCheck, Brain } from 'lucide-react'
import useCountUp from '../hooks/useCountUp'
import { CATEGORY_COLORS } from '../lib/colors'
import { useReady } from '../lib/readyContext'
import UIverseStatCard from './UIverseStatCard'

// 7-day sparkline for attacks card
function Sparkline({ data, color }) {
  const max = Math.max(...data)
  const w = 56, h = 24
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - (v / max) * (h - 2) - 1
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  const lastY = h - (data[data.length - 1] / max) * (h - 2) - 1
  return (
    <svg width={w} height={h} style={{ display: 'block', overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5}
        strokeLinecap="round" strokeLinejoin="round" opacity={0.6} />
      <circle cx={w} cy={lastY} r={2} fill={color} opacity={0.9} />
    </svg>
  )
}

const sparkWeek = [28, 41, 35, 62, 44, 51, 347]

const cards = [
  { label: 'Total Traffic',    target: 12480, decimals: 0, suffix: '',  color: '#e2e2e2',              icon: Activity,      sub: '+5.2% today',    spark: null      },
  { label: 'Attacks Detected', target: 347,   decimals: 0, suffix: '',  color: CATEGORY_COLORS.DoS,    icon: AlertTriangle, sub: 'Last 7 days',    spark: sparkWeek },
  { label: 'Normal Traffic',   target: 12133, decimals: 0, suffix: '',  color: CATEGORY_COLORS.Normal, icon: ShieldCheck,   sub: '97.2% of total', spark: null      },
  { label: 'Model Confidence', target: 98.4,  decimals: 1, suffix: '%', color: '#3b82f6',              icon: Brain,         sub: 'XGBoost',        spark: null      },
]

function StatCard({ label, target, decimals, suffix, color, icon: Icon, sub, spark, delay }) {
  const ready = useReady()
  const value = useCountUp(ready ? target : 0, 1500, decimals)
  const display = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString()

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
    >
      {/* UIverse ticket-style card from uiverse.io by zeeshan_2112 */}
      <UIverseStatCard
        label={label}
        value={display}
        suffix={suffix}
        subLabel={sub}
        color={color}
        icon={Icon}
      />
    </motion.div>
  )
}

export default function StatCards() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 14 }}>
      {cards.map((c, i) => <StatCard key={c.label} {...c} delay={i * 0.08} />)}
    </div>
  )
}

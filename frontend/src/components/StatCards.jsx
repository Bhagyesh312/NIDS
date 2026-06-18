import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, AlertTriangle, ShieldCheck, Brain } from 'lucide-react'
import useCountUp from '../hooks/useCountUp'
import { CATEGORY_COLORS } from '../lib/colors'
import { useReady } from '../lib/readyContext'
import { useMockMode } from '../lib/mockModeContext'
import { getStats } from '../lib/api'
import UIverseStatCard from './UIverseStatCard'

// Mock fallback values — shown in demo mode or when backend is offline
const MOCK_STATS = {
  total:    12480,
  attacks:  347,
  normal:   12133,
  accuracy: '98.4%',
}

// 7-day sparkline for attacks card (mock)
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

const mockSparkWeek = [28, 41, 35, 62, 44, 51, 347]

function StatCard({ label, target, decimals, suffix, color, icon: Icon, sub, delay }) {
  const ready = useReady()
  const value   = useCountUp(ready ? target : 0, 1500, decimals)
  const display = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString()

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
    >
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
  const { mockMode } = useMockMode()
  const [stats, setStats] = useState(MOCK_STATS)

  useEffect(() => {
    if (mockMode) {
      setStats(MOCK_STATS)
      return
    }
    getStats()
      .then(res => {
        const d = res.data
        // accuracy comes from model_info.json (test accuracy)
        const acc = d.accuracy || MOCK_STATS.accuracy
        setStats({
          total:    d.total    ?? MOCK_STATS.total,
          attacks:  d.attacks  ?? MOCK_STATS.attacks,
          normal:   d.normal   ?? MOCK_STATS.normal,
          accuracy: acc,
        })
      })
      .catch(() => setStats(MOCK_STATS))
  }, [mockMode])

  const normalPct = stats.total > 0
    ? ((stats.normal / stats.total) * 100).toFixed(1) + '% of total'
    : '97.2% of total'

  const cards = [
    { label: 'Total Traffic',    target: stats.total,   decimals: 0, suffix: '',  color: '#e2e2e2',              icon: Activity,      sub: 'All predictions'   },
    { label: 'Attacks Detected', target: stats.attacks, decimals: 0, suffix: '',  color: CATEGORY_COLORS.DoS,    icon: AlertTriangle, sub: 'All time'          },
    { label: 'Normal Traffic',   target: stats.normal,  decimals: 0, suffix: '',  color: CATEGORY_COLORS.Normal, icon: ShieldCheck,   sub: normalPct           },
    { label: 'Model Accuracy',   target: parseFloat(stats.accuracy) || 98.4, decimals: 1, suffix: '%', color: '#3b82f6', icon: Brain, sub: 'XGBoost test set'  },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 14 }}>
      {cards.map((c, i) => <StatCard key={c.label} {...c} delay={i * 0.08} />)}
    </div>
  )
}

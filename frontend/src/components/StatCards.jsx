import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Activity, AlertTriangle, ShieldCheck, Brain } from 'lucide-react'
import useCountUp from '../hooks/useCountUp'
import { CATEGORY_COLORS } from '../lib/colors'
import { useReady } from '../lib/readyContext'
import { useMockMode } from '../lib/mockModeContext'
import { useModel } from '../lib/modelContext'
import { getStats } from '../lib/api'
import UIverseStatCard from './UIverseStatCard'

const MOCK_STATS_KDD = {
  total: 125973, attacks: 58630, normal: 67343, accuracy: '80.22%',
}
const MOCK_STATS_CICIDS = {
  total: 1979513, attacks: 140200, normal: 1839313, accuracy: '99.86%',
}

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
  const { mockMode }    = useMockMode()
  const { activeModel } = useModel()

  const MOCK = useMemo(
    () => activeModel === 'cicids' ? MOCK_STATS_CICIDS : MOCK_STATS_KDD,
    [activeModel]
  )
  const [stats, setStats] = useState(MOCK)

  // Re-fetch whenever model or mock mode changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (mockMode) { setStats(MOCK); return }
    getStats(activeModel)
      .then(res => {
        const d   = res.data
        const acc = d.accuracy || MOCK.accuracy
        setStats({
          total:    d.total    ?? MOCK.total,
          attacks:  d.attacks  ?? MOCK.attacks,
          normal:   d.normal   ?? MOCK.normal,
          accuracy: acc,
        })
      })
      .catch(() => setStats(MOCK))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mockMode, activeModel])

  const normalLabel = activeModel === 'cicids' ? 'Benign' : 'Normal'
  const normalPct   = stats.total > 0
    ? ((stats.normal / stats.total) * 100).toFixed(1) + '% of total'
    : '97.2% of total'

  const subLabel = activeModel === 'cicids' ? 'CICIDS2017 test set' : 'NSL-KDD test set'

  const cards = [
    { label: 'Total Traffic',    target: stats.total,   decimals: 0, suffix: '',  color: '#e2e2e2',              icon: Activity,      sub: 'All predictions'   },
    { label: 'Attacks Detected', target: stats.attacks, decimals: 0, suffix: '',  color: CATEGORY_COLORS.DoS,    icon: AlertTriangle, sub: 'All time'          },
    { label: normalLabel,        target: stats.normal,  decimals: 0, suffix: '',  color: CATEGORY_COLORS.Normal, icon: ShieldCheck,   sub: normalPct           },
    { label: 'Model Accuracy',   target: parseFloat(stats.accuracy) || 99.9, decimals: 2, suffix: '%', color: '#3b82f6', icon: Brain, sub: subLabel },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 14 }}>
      {cards.map((c, i) => <StatCard key={c.label} {...c} delay={i * 0.08} />)}
    </div>
  )
}

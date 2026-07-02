import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '../components/Header'
import StatCards from '../components/StatCards'
import Badge from '../components/Badge'
import { CATEGORY_COLORS, CATEGORIES, CICIDS_CATEGORIES, getLabelColor } from '../lib/colors'
import { useState, useEffect, useCallback } from 'react'
import { Command, X, Play, Square, Activity } from 'lucide-react'
import { useReady } from '../lib/readyContext'
import { useMockMode } from '../lib/mockModeContext'
import { useRefreshSettings } from '../lib/refreshContext'
import { useModel } from '../lib/modelContext'
import { getStats, getTraffic, getAlerts, startSimulation, stopSimulation, getSimStatus } from '../lib/api'

// ── Mock fallback data ───────────────────────────────────────────────────────

const MOCK_DISTRIBUTION_KDD = [
  { name: 'Normal', value: 67343 },
  { name: 'DoS',    value: 45927 },
  { name: 'Probe',  value: 11656 },
  { name: 'R2L',    value: 995   },
  { name: 'U2R',    value: 52    },
]

const MOCK_DISTRIBUTION_CICIDS = [
  { name: 'Benign',     value: 1839313 },
  { name: 'DoS',        value: 87000   },
  { name: 'DDoS',       value: 41835   },
  { name: 'PortScan',   value: 23821   },
  { name: 'BruteForce', value: 2075    },
  { name: 'Bot',        value: 293     },
]

const MOCK_TOTAL_KDD    = 125973
const MOCK_TOTAL_CICIDS = 1979513

const MOCK_TRAFFIC = {
  '6h': [
    { t: '18:00', n: 1420, a: 44 }, { t: '19:00', n: 1310, a: 38 },
    { t: '20:00', n: 980,  a: 31 }, { t: '21:00', n: 860,  a: 24 },
    { t: '22:00', n: 740,  a: 19 }, { t: '23:00', n: 620,  a: 14 },
  ],
  '12h': [
    { t: '12:00', n: 1380, a: 55 }, { t: '13:00', n: 1490, a: 70 },
    { t: '14:00', n: 1600, a: 78 }, { t: '15:00', n: 1680, a: 85 },
    { t: '16:00', n: 1750, a: 91 }, { t: '17:00', n: 1600, a: 60 },
    { t: '18:00', n: 1420, a: 44 }, { t: '19:00', n: 1310, a: 38 },
    { t: '20:00', n: 980,  a: 31 }, { t: '21:00', n: 860,  a: 24 },
    { t: '22:00', n: 740,  a: 19 }, { t: '23:00', n: 620,  a: 14 },
  ],
  '24h': [
    { t: '00:00', n: 820, a: 12 }, { t: '02:00', n: 432, a: 8  },
    { t: '04:00', n: 380, a: 5  }, { t: '06:00', n: 690, a: 22 },
    { t: '08:00', n: 1200,a: 48 }, { t: '10:00', n: 1450,a: 62 },
    { t: '12:00', n: 1380,a: 55 }, { t: '14:00', n: 1600,a: 78 },
    { t: '16:00', n: 1750,a: 91 }, { t: '18:00', n: 1420,a: 44 },
    { t: '20:00', n: 980, a: 31 }, { t: '22:00', n: 740, a: 19 },
  ],
  '7d': [
    { t: 'Mon', n: 9200,  a: 28  }, { t: 'Tue', n: 11400, a: 41 },
    { t: 'Wed', n: 10800, a: 35  }, { t: 'Thu', n: 13200, a: 62 },
    { t: 'Fri', n: 11900, a: 44  }, { t: 'Sat', n: 8600,  a: 51 },
    { t: 'Sun', n: 12480, a: 347 },
  ],
}

const MOCK_ALERTS_KDD = [
  { id: 1,  type: 'DoS',   src: '192.168.1.104', dst: '10.0.0.1',  conf: 98.2, time: '2m ago'  },
  { id: 2,  type: 'Probe', src: '172.16.0.55',   dst: '10.0.0.5',  conf: 94.7, time: '8m ago'  },
  { id: 3,  type: 'R2L',   src: '203.0.113.42',  dst: '10.0.0.12', conf: 89.1, time: '15m ago' },
  { id: 4,  type: 'DoS',   src: '198.51.100.23', dst: '10.0.0.1',  conf: 97.5, time: '21m ago' },
  { id: 5,  type: 'Probe', src: '192.168.1.200', dst: '10.0.0.8',  conf: 91.3, time: '34m ago' },
  { id: 6,  type: 'U2R',   src: '10.0.0.99',     dst: '10.0.0.3',  conf: 83.6, time: '47m ago' },
  { id: 7,  type: 'DoS',   src: '10.10.1.88',    dst: '10.0.0.2',  conf: 96.1, time: '1h ago'  },
  { id: 8,  type: 'R2L',   src: '172.20.5.11',   dst: '10.0.0.6',  conf: 87.4, time: '1h ago'  },
  { id: 9,  type: 'Normal',src: '192.168.0.14',  dst: '10.0.0.4',  conf: 99.8, time: '1h ago'  },
  { id: 10, type: 'U2R',   src: '10.0.2.33',     dst: '10.0.0.9',  conf: 81.2, time: '2h ago'  },
]

const MOCK_ALERTS_CICIDS = [
  { id: 1,  type: 'DoS',        src: '192.168.1.104', dst: '10.0.0.1',  conf: 99.1, time: '2m ago'  },
  { id: 2,  type: 'DDoS',       src: '172.16.0.55',   dst: '10.0.0.5',  conf: 98.4, time: '5m ago'  },
  { id: 3,  type: 'PortScan',   src: '203.0.113.42',  dst: '10.0.0.12', conf: 96.7, time: '12m ago' },
  { id: 4,  type: 'BruteForce', src: '198.51.100.23', dst: '10.0.0.1',  conf: 94.2, time: '18m ago' },
  { id: 5,  type: 'BruteForce', src: '192.168.1.200', dst: '10.0.0.8',  conf: 92.8, time: '31m ago' },
  { id: 6,  type: 'Bot',        src: '10.0.0.99',     dst: '185.0.0.1', conf: 88.3, time: '44m ago' },
  { id: 7,  type: 'DoS',        src: '10.10.1.88',    dst: '10.0.0.2',  conf: 97.6, time: '1h ago'  },
  { id: 8,  type: 'DDoS',       src: '172.20.5.11',   dst: '10.0.0.6',  conf: 99.3, time: '1h ago'  },
  { id: 9,  type: 'Benign',     src: '192.168.0.14',  dst: '10.0.0.4',  conf: 99.9, time: '1h ago'  },
  { id: 10, type: 'Infiltration',src:'10.0.2.33',      dst: '10.0.0.9',  conf: 87.9, time: '2h ago'  },
]

// Normalize an alert row from the backend into the shape the table needs
function normalizeAlert(a) {
  return {
    id:   a.id,
    type: a.prediction,
    src:  a.src_ip     || '—',
    dst:  a.dst_ip     || '—',
    conf: parseFloat((a.confidence * 100).toFixed(1)),
    time: new Date(a.created_at).toLocaleString(),
  }
}

const TIME_RANGES = ['6h', '12h', '24h', '7d']

// ── Helpers ──────────────────────────────────────────────────────────────────

const card = { background: '#161616', border: '1px solid #1f1f1f', borderRadius: 8, padding: '18px 20px' }

const fadeUp = (delay = 0, ready = true) => ({
  initial: { opacity: 0, y: 14 },
  animate: ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
  transition: { duration: 0.4, delay, ease: 'easeOut' },
})

function FilterBtn({ label, active, color, onClick }) {
  return (
    <motion.button
      whileHover={{ borderColor: color || '#555' }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{
        background: active ? (color ? `${color}18` : 'var(--surface3)') : 'transparent',
        border: `1px solid ${active ? (color || 'var(--border2)') : 'var(--border2)'}`,
        borderRadius: 5, color: active ? (color || 'var(--text-strong)') : 'var(--text-soft)',
        fontSize: 11, fontWeight: active ? 600 : 400,
        padding: '4px 10px', cursor: 'pointer', transition: 'all 0.15s',
      }}
    >
      {label}
    </motion.button>
  )
}

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 6, padding: '8px 12px' }}>
      <p style={{ color: 'var(--text-soft)', fontSize: 11, marginBottom: 4 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, fontSize: 12, fontWeight: 600 }}>
          {p.name}: {p.value.toLocaleString()}
        </p>
      ))}
    </div>
  )
}

// ── Component ────────────────────────────────────────────────────────────────

export default function Dashboard({ feedOpen, onFeedToggle }) {
  const ready                             = useReady()
  const { mockMode }                      = useMockMode()
  const { autoRefresh, refreshRate }      = useRefreshSettings()
  const { activeModel }                   = useModel()
  const [hint, setHint]                   = useState(() => !localStorage.getItem('cmd-hint-dismissed'))
  const [timeRange, setTimeRange]         = useState('24h')
  const [alertFilter, setAlertFilter]     = useState('All')

  // ── Real data state ──────────────────────────────────────────
  const [distribution, setDistribution]   = useState(MOCK_DISTRIBUTION_KDD)
  const [total, setTotal]                 = useState(MOCK_TOTAL_KDD)
  const [trafficData, setTrafficData]     = useState(MOCK_TRAFFIC)
  const [alerts, setAlerts] = useState(MOCK_ALERTS_KDD)

  // ── Live simulation state ────────────────────────────────────
  const [simRunning,  setSimRunning]  = useState(false)
  const [simStats,    setSimStats]    = useState({ total_sent: 0, attacks_found: 0 })
  const [simLoading,  setSimLoading]  = useState(false)
  const [simInterval, setSimInterval] = useState('5')
  const [simBatch,    setSimBatch]    = useState('5')

  // Reset alert filter when model changes
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setAlertFilter('All') }, [activeModel])
  const isCicids      = activeModel === 'cicids'
  const normalLabel   = isCicids ? 'Benign' : 'Normal'
  const MOCK_DIST     = isCicids ? MOCK_DISTRIBUTION_CICIDS : MOCK_DISTRIBUTION_KDD
  const MOCK_TOT      = isCicids ? MOCK_TOTAL_CICIDS        : MOCK_TOTAL_KDD
  // All attack categories for this model (excluding normal)
  const attackCats    = isCicids
    ? CICIDS_CATEGORIES.filter(c => c !== 'Benign')
    : CATEGORIES.filter(c => c !== 'Normal')
  const ATTACK_FILTERS = ['All', ...attackCats]

  // Dynamic pie colors from the distribution data
  const getPieColor = (name) => getLabelColor(name)

  useEffect(() => { document.title = 'NIDS · Dashboard' }, [])

  // Fetch distribution + stat totals — re-runs on model change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (mockMode) { setDistribution(MOCK_DIST); setTotal(MOCK_TOT); return }
    getStats(activeModel)
      .then(res => {
        const d = res.data
        if (d.distribution?.length) {
          setDistribution(d.distribution)
          setTotal(d.total ?? MOCK_TOT)
        } else {
          setDistribution(MOCK_DIST)
          setTotal(MOCK_TOT)
        }
      })
      .catch(() => { setDistribution(MOCK_DIST); setTotal(MOCK_TOT) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mockMode, activeModel])

  // Fetch traffic chart data for current time range
  const fetchTraffic = useCallback((range) => {
    if (mockMode) return
    getTraffic(range, activeModel)
      .then(res => {
        if (res.data?.length) {
          setTrafficData(prev => ({ ...prev, [range]: res.data }))
        }
      })
      .catch(() => {})
  }, [mockMode, activeModel])

  // Reset traffic cache and re-fetch when model changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTrafficData(MOCK_TRAFFIC)
    fetchTraffic(timeRange)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModel])

  useEffect(() => { fetchTraffic(timeRange) }, [timeRange, fetchTraffic])

  // Fetch recent alerts — re-runs on model change
  useEffect(() => {
    const mockAlerts = activeModel === 'cicids' ? MOCK_ALERTS_CICIDS : MOCK_ALERTS_KDD
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (mockMode) { setAlerts(mockAlerts); return }
    getAlerts({ limit: 10, model: activeModel })
      .then(res => {
        if (res.data?.length) setAlerts(res.data.map(normalizeAlert))
        else setAlerts(mockAlerts)
      })
      .catch(() => setAlerts(mockAlerts))
  }, [mockMode, activeModel])

  // Auto-refresh alerts using settings-controlled interval
  useEffect(() => {
    if (mockMode || !autoRefresh) return
    const ms = parseInt(refreshRate, 10) * 1000
    const id = setInterval(() => {
      getAlerts({ limit: 10, model: activeModel })
        .then(res => { if (res.data?.length) setAlerts(res.data.map(normalizeAlert)) })
        .catch(() => {})
    }, ms)
    return () => clearInterval(id)
  }, [mockMode, autoRefresh, refreshRate, activeModel])

  // ── Simulation helpers ───────────────────────────────────────
  // Poll sim status while running (every 3s)
  useEffect(() => {
    if (!simRunning || mockMode) return
    const id = setInterval(() => {
      getSimStatus()
        .then(r => {
          setSimStats({ total_sent: r.data.total_sent, attacks_found: r.data.attacks_found })
          if (!r.data.running) setSimRunning(false)
        })
        .catch(() => {})
    }, 3000)
    return () => clearInterval(id)
  }, [simRunning, mockMode])

  const handleSimToggle = async () => {
    if (simLoading) return
    setSimLoading(true)
    try {
      if (simRunning) {
        await stopSimulation()
        setSimRunning(false)
      } else {
        const res = await startSimulation(activeModel, parseFloat(simInterval), parseInt(simBatch))
        setSimRunning(res.data.running || res.data.status === 'started' || res.data.status === 'already_running')
        setSimStats({ total_sent: res.data.total_sent || 0, attacks_found: res.data.attacks_found || 0 })
      }
    } catch {
      // backend offline — fail silently
    } finally {
      setSimLoading(false)
    }
  }

  const trafficChartData = trafficData[timeRange] ?? MOCK_TRAFFIC[timeRange]

  const filteredAlerts = alertFilter === 'All'
    ? alerts
    : alerts.filter(a => a.type === alertFilter)

  // For the donut centre text — find the "normal" entry by label
  const normalItem = distribution.find(d => d.name === normalLabel)
  const normalPct  = total > 0 && normalItem
    ? ((normalItem.value / total) * 100).toFixed(1)
    : '53.4'

  const dismissHint = () => {
    localStorage.setItem('cmd-hint-dismissed', '1')
    setHint(false)
  }

  return (
    <div>
      <Header title="Dashboard" subtitle="Real-time intrusion detection overview"
        onFeedToggle={onFeedToggle} feedOpen={feedOpen} />

      {/* Ctrl+K hint */}
      <AnimatePresence>
        {hint && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={ready ? { opacity: 1, height: 'auto' } : { opacity: 0, height: 0 }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden', marginBottom: 12 }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#0f1620', border: '1px solid #1e2d45',
              borderRadius: 7, padding: '9px 14px',
            }}>
              <Command size={13} color="#3b82f6" />
              <span style={{ fontSize: 12, color: '#888', flex: 1 }}>
                Press{' '}
                <kbd style={{ fontSize: 11, color: '#ccc', background: '#1a2332', border: '1px solid #2a3a4a', borderRadius: 4, padding: '1px 6px', fontFamily: 'monospace' }}>
                  Ctrl K
                </kbd>
                {' '}to open the command palette — search pages and look up attack types.
              </span>
              <motion.button whileHover={{ color: '#ccc' }} onClick={dismissHint}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#333', padding: 2, display: 'flex' }}>
                <X size={13} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stat cards — now fetch real data via StatCards component */}
      <StatCards />

      {/* ── Live Simulation Panel ─────────────────────────────── */}
      {!mockMode && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={{ duration: 0.35, delay: 0.18 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: simRunning ? 'rgba(34,197,94,0.04)' : '#111',
            border: `1px solid ${simRunning ? '#22c55e30' : '#1f1f1f'}`,
            borderRadius: 8, padding: '10px 16px', marginBottom: 12,
            transition: 'all 0.3s',
          }}
        >
          {/* Status dot */}
          <motion.div
            animate={simRunning ? { opacity: [1, 0.3, 1], scale: [1, 1.2, 1] } : { opacity: 0.3 }}
            transition={simRunning ? { duration: 1.5, repeat: Infinity } : {}}
            style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
              background: simRunning ? '#22c55e' : '#333' }}
          />

          <Activity size={13} color={simRunning ? '#22c55e' : '#444'} />

          <span style={{ fontSize: 12, color: simRunning ? '#22c55e' : '#555', fontWeight: 500 }}>
            {simRunning ? 'Simulation running' : 'Live Simulation'}
          </span>

          {simRunning && (
            <span style={{ fontSize: 11, color: '#444', fontFamily: 'monospace' }}>
              {simStats.total_sent} sent · {simStats.attacks_found} attacks
            </span>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Interval selector */}
            {!simRunning && (
              <>
                <span style={{ fontSize: 11, color: '#444' }}>every</span>
                <select value={simInterval} onChange={e => setSimInterval(e.target.value)}
                  style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 5,
                    color: '#888', fontSize: 11, padding: '3px 6px', outline: 'none', cursor: 'pointer' }}>
                  {['2','5','10','15','30'].map(v => (
                    <option key={v} value={v}>{v}s</option>
                  ))}
                </select>
                <span style={{ fontSize: 11, color: '#444' }}>batch</span>
                <select value={simBatch} onChange={e => setSimBatch(e.target.value)}
                  style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 5,
                    color: '#888', fontSize: 11, padding: '3px 6px', outline: 'none', cursor: 'pointer' }}>
                  {['1','3','5','10','20'].map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
                <span style={{ fontSize: 10, color: '#444' }}>
                  ({activeModel === 'cicids' ? 'CICIDS2017' : 'NSL-KDD'})
                </span>
              </>
            )}

            {/* Start / Stop button */}
            <motion.button
              whileHover={{ borderColor: simRunning ? '#ef4444' : '#22c55e' }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSimToggle}
              disabled={simLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'transparent',
                border: `1px solid ${simRunning ? '#ef444430' : '#2a2a2a'}`,
                borderRadius: 6, padding: '5px 12px', cursor: 'pointer',
                color: simRunning ? '#ef4444' : '#555', fontSize: 12,
                opacity: simLoading ? 0.5 : 1, transition: 'all 0.15s',
              }}
            >
              {simRunning
                ? <><Square size={11} /> Stop</>
                : <><Play  size={11} /> Start</>}
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* ── Traffic chart ─────────────────────────────────────── */}
      <motion.div {...fadeUp(0.32, ready)} style={{ ...card, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#ccc' }}>Traffic Overview</span>
            <span style={{ fontSize: 11, color: '#333', marginLeft: 8 }}>Left: normal · Right: attacks</span>
            {!mockMode && <span style={{ fontSize: 10, color: '#444', marginLeft: 8 }}>live</span>}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {TIME_RANGES.map(r => (
              <FilterBtn key={r} label={r} active={timeRange === r} onClick={() => setTimeRange(r)} />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={timeRange}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
          >
            <ResponsiveContainer width="100%" height={170}>
              <AreaChart data={trafficChartData} margin={{ left: -16, right: 16, top: 4 }}>
                <defs>
                  <linearGradient id="gN" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={CATEGORY_COLORS.Normal} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={CATEGORY_COLORS.Normal} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={CATEGORY_COLORS.DoS} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={CATEGORY_COLORS.DoS} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="#1f1f1f" vertical={false} />
                <XAxis dataKey="t" tick={{ fill: '#333', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left"  tick={{ fill: '#333', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right"
                  tick={{ fill: CATEGORY_COLORS.DoS, fontSize: 10, opacity: 0.5 }} axisLine={false} tickLine={false} />
                <Tooltip content={<TT />} />
                <Area yAxisId="left"  type="monotone" dataKey="n" stroke={CATEGORY_COLORS.Normal}
                  strokeWidth={1.5} fill="url(#gN)" name="Normal" dot={false} animationDuration={ready ? 600 : 0} />
                <Area yAxisId="right" type="monotone" dataKey="a" stroke={CATEGORY_COLORS.DoS}
                  strokeWidth={2} fill="url(#gA)" name="Attacks" dot={false} animationDuration={ready ? 700 : 0} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* ── Bottom row ───────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 12 }}>

        {/* Donut — distribution from /stats */}
        <motion.div {...fadeUp(0.42, ready)} style={{ ...card, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#ccc', marginBottom: 2 }}>Distribution</div>
          <div style={{ fontSize: 11, color: '#333', marginBottom: 12 }}>
            {total.toLocaleString()} total · {isCicids ? 'CICIDS2017' : 'NSL-KDD'}
          </div>

          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie
                  data={distribution} cx="50%" cy="50%"
                  innerRadius={58} outerRadius={88}
                  dataKey="value" paddingAngle={3}
                  animationBegin={ready ? 400 : 99999} animationDuration={ready ? 1200 : 0} stroke="none"
                >
                  {distribution.map((d) => (
                    <Cell key={d.name} fill={getPieColor(d.name)} opacity={0.9} />
                  ))}
                </Pie>
                <Tooltip content={<TT />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center', pointerEvents: 'none',
            }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#f0f0f0', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{normalPct}%</div>
              <div style={{ fontSize: 10, color: '#444', marginTop: 3 }}>{normalLabel}</div>
            </div>
          </div>

          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 7 }}>
            {distribution.map((d) => {
              const pct   = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0.0'
              const color = getPieColor(d.name)
              return (
                <motion.div key={d.name}
                  initial={{ opacity: 0, x: -10 }} animate={ready ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                  transition={{ delay: 0.6 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                    <span style={{ width: 7, height: 7, borderRadius: 2, background: color, flexShrink: 0 }} />
                    <span style={{ color: '#888', fontSize: 11, flex: 1 }}>
                      {d.name.replace('Web Attack \uFFFD ', 'Web/')}
                    </span>
                    <span style={{ color: '#555', fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
                    <span style={{ color: '#333', fontSize: 11, fontVariantNumeric: 'tabular-nums', width: 44, textAlign: 'right' }}>{d.value.toLocaleString()}</span>
                  </div>
                  <div style={{ height: 2, background: '#1f1f1f', borderRadius: 2 }}>
                    <motion.div
                      initial={{ width: 0 }} animate={ready ? { width: `${pct}%` } : { width: 0 }}
                      transition={{ delay: 0.7, duration: 0.8, ease: 'easeOut' }}
                      style={{ height: '100%', background: color, borderRadius: 2, opacity: 0.7 }}
                    />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Recent alerts table — from /alerts in API mode */}
        <motion.div {...fadeUp(0.5, ready)} style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#ccc' }}>
              Recent Alerts
              <span style={{ fontSize: 11, color: '#333', marginLeft: 8, fontWeight: 400 }}>
                {filteredAlerts.length} shown
              </span>
            </span>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {ATTACK_FILTERS.map(f => (
                <FilterBtn
                  key={f} label={f} active={alertFilter === f}
                  color={f === 'All' ? undefined : getLabelColor(f)}
                  onClick={() => {
                    setAlertFilter(f)
                  }}
                />
              ))}
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Type', 'Source', 'Destination', 'Confidence', 'When'].map(h => (
                  <th key={h} style={{ padding: '0 0 10px', textAlign: 'left', fontSize: 11, color: '#333', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {filteredAlerts.map((a, i) => (
                  <motion.tr
                    key={a.id} layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={ready ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: ready ? i * 0.04 : 0, duration: 0.2 }}
                    whileHover={{ backgroundColor: '#1a1a1a' }}
                    style={{ borderTop: '1px solid #1a1a1a' }}
                  >
                    <td style={{ padding: '9px 0' }}><Badge label={a.type} /></td>
                    <td style={{ padding: '9px 0', fontSize: 12, color: '#555', fontFamily: 'monospace' }}>{a.src}</td>
                    <td style={{ padding: '9px 0', fontSize: 12, color: '#555', fontFamily: 'monospace' }}>{a.dst}</td>
                    <td style={{ padding: '9px 0', fontSize: 12, color: '#ccc', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                      {typeof a.conf === 'number' ? a.conf.toFixed(1) : a.conf}%
                    </td>
                    <td style={{ padding: '9px 0', fontSize: 11, color: '#333' }}>{a.time}</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filteredAlerts.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '24px 0', textAlign: 'center', color: '#333', fontSize: 12 }}>
                    No {alertFilter} alerts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </motion.div>

      </div>
    </div>
  )
}

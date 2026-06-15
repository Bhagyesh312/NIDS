import { useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { Download, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import Header from '../components/Header'
import Badge from '../components/Badge'
import { CATEGORY_COLORS, CATEGORIES, categoryColors } from '../lib/colors'
import { useReady } from '../lib/readyContext'

// ── Mock data ────────────────────────────────────────────────────────────────

const weekly = [
  { day: 'Mon', DoS: 28,  Probe: 12, R2L: 4,  U2R: 1,  Normal: 1820 },
  { day: 'Tue', DoS: 41,  Probe: 18, R2L: 6,  U2R: 2,  Normal: 2140 },
  { day: 'Wed', DoS: 35,  Probe: 9,  R2L: 3,  U2R: 0,  Normal: 1980 },
  { day: 'Thu', DoS: 62,  Probe: 22, R2L: 8,  U2R: 3,  Normal: 2300 },
  { day: 'Fri', DoS: 44,  Probe: 15, R2L: 5,  U2R: 1,  Normal: 2100 },
  { day: 'Sat', DoS: 18,  Probe: 7,  R2L: 2,  U2R: 0,  Normal: 1240 },
  { day: 'Sun', DoS: 119, Probe: 38, R2L: 12, U2R: 4,  Normal: 2900 },
]

const monthly = [
  { month: 'Jan', attacks: 180, normal: 14200 },
  { month: 'Feb', attacks: 220, normal: 15800 },
  { month: 'Mar', attacks: 195, normal: 13900 },
  { month: 'Apr', attacks: 310, normal: 17200 },
  { month: 'May', attacks: 280, normal: 16100 },
  { month: 'Jun', attacks: 347, normal: 12480 },
]

const categoryStats = [
  { name: 'DoS',   total: 347, prev: 338, pct: 53.4 },
  { name: 'Probe', total: 121, prev: 98,  pct: 18.6 },
  { name: 'R2L',   total: 40,  prev: 44,  pct: 6.2  },
  { name: 'U2R',   total: 11,  prev: 9,   pct: 1.7  },
  { name: 'Normal',total: 12133,prev: 11800, pct: 20.1},
]

const topIPs = [
  { ip: '192.168.1.104', count: 84,  type: 'DoS'   },
  { ip: '172.16.0.55',   count: 56,  type: 'Probe'  },
  { ip: '10.10.1.88',    count: 48,  type: 'DoS'   },
  { ip: '203.0.113.42',  count: 31,  type: 'R2L'   },
  { ip: '198.51.100.23', count: 29,  type: 'DoS'   },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

const card = { background: '#161616', border: '1px solid #1f1f1f', borderRadius: 8, padding: '18px 20px' }

const fadeUp = (delay = 0, ready = true) => ({
  initial: { opacity: 0, y: 14 },
  animate: ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
  transition: { duration: 0.4, delay, ease: 'easeOut' },
})

// Same tooltip as Dashboard
const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 6, padding: '8px 12px' }}>
      <p style={{ color: '#555', fontSize: 11, marginBottom: 4 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color || p.fill, fontSize: 12, fontWeight: 600 }}>
          {p.name}: {p.value.toLocaleString()}
        </p>
      ))}
    </div>
  )
}

// Custom cursor — dark background instead of Recharts default grey
const DarkCursor = ({ x, y, width, height }) => (
  <rect x={x} y={y} width={width} height={height}
    fill="rgba(255,255,255,0.03)" rx={4} />
)

// Custom bar with glow on active/hover
function GlowBar(color) {
  return function BarShape(props) {
    const { x, y, width, height, isActive } = props
    if (!height || height <= 0) return null
    return (
      <g>
        {isActive && (
          <rect x={x - 2} y={y - 2} width={width + 4} height={height + 4}
            rx={5} fill={color} opacity={0.15}
            style={{ filter: `blur(6px)` }} />
        )}
        <rect x={x} y={y} width={width} height={height}
          rx={4} fill={color}
          opacity={isActive ? 1 : 0.85}
          style={isActive ? { filter: `drop-shadow(0 0 6px ${color})` } : {}}
        />
      </g>
    )
  }
}

function Trend({ current, prev }) {
  const diff = current - prev
  const pct  = prev > 0 ? ((diff / prev) * 100).toFixed(1) : 0
  if (diff > 0) return <span style={{ fontSize: 11, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 3 }}><TrendingUp size={11} />+{pct}%</span>
  if (diff < 0) return <span style={{ fontSize: 11, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 3 }}><TrendingDown size={11} />{pct}%</span>
  return <span style={{ fontSize: 11, color: '#555', display: 'flex', alignItems: 'center', gap: 3 }}><Minus size={11} />0%</span>
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const ready = useReady()
  useEffect(() => { document.title = 'NIDS · Reports' }, [])

  const totalAttacks = categoryStats.filter(c => c.name !== 'Normal').reduce((s, c) => s + c.total, 0)

  const downloadReport = () => {
    const lines = [
      'NIDS Security Report',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      'Category Summary',
      ...categoryStats.map(c => `${c.name}: ${c.total}`),
      '',
      'Top Attack Sources',
      ...topIPs.map(ip => `${ip.ip} (${ip.type}): ${ip.count} events`),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = 'nids_report.txt'; a.click()
  }

  return (
    <div>
      <Header title="Reports" subtitle="Security summary and attack trend analysis" />

      {/* Summary stat row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>
        {[
          { label: 'Total Attacks',  value: totalAttacks.toLocaleString(), color: CATEGORY_COLORS.DoS },
          { label: 'This Week',      value: weekly.reduce((s,d) => s + d.DoS + d.Probe + d.R2L + d.U2R, 0), color: CATEGORY_COLORS.Probe },
          { label: 'Avg / Day',      value: Math.round(totalAttacks / 7), color: CATEGORY_COLORS.R2L },
          { label: 'Detection Rate', value: '98.4%', color: '#3b82f6' },
        ].map((s, i) => (
          <motion.div key={s.label} {...fadeUp(i * 0.08, ready)} style={card}>
            <div style={{ fontSize: 12, color: '#555', marginBottom: 12 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.5px', lineHeight: 1 }}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12, marginBottom: 12 }}>

        {/* Weekly attacks by type */}
        <motion.div {...fadeUp(0.28, ready)} style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#ccc' }}>Weekly Attacks by Type</span>
            <div style={{ display: 'flex', gap: 12 }}>
              {CATEGORIES.filter(c => c !== 'Normal').map(c => (
                <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: CATEGORY_COLORS[c], display: 'inline-block' }} />
                  <span style={{ fontSize: 11, color: '#555' }}>{c}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weekly} barSize={12} barGap={2} margin={{ left: -16, right: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#1f1f1f" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: '#333', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#333', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<TT />} cursor={<DarkCursor />} />
              {CATEGORIES.filter(c => c !== 'Normal').map(c => (
                <Bar key={c} dataKey={c} shape={GlowBar(CATEGORY_COLORS[c])}
                  radius={[4,4,0,0]} name={c} animationDuration={800} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Monthly trend */}
        <motion.div {...fadeUp(0.35, ready)} style={card}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#ccc', marginBottom: 16 }}>Monthly Attack Trend</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthly} margin={{ left: -16, right: 8, top: 4 }}>
              <defs>
                <linearGradient id="gAttackLine" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={CATEGORY_COLORS.DoS} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={CATEGORY_COLORS.DoS} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="#1f1f1f" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#333', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#333', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<TT />} cursor={{ stroke: '#2a2a2a', strokeWidth: 1 }} />
              <Line type="monotone" dataKey="attacks" stroke={CATEGORY_COLORS.DoS} strokeWidth={1.5}
                dot={{ fill: CATEGORY_COLORS.DoS, r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
                name="Attacks" animationDuration={1200} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

        {/* Category breakdown */}
        <motion.div {...fadeUp(0.42, ready)} style={card}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#ccc', marginBottom: 16 }}>Category Breakdown</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {categoryStats.map((c, i) => (
              <motion.div key={c.name}
                initial={{ opacity: 0, x: -10 }}
                animate={ready ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                transition={{ delay: 0.5 + i * 0.06 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                  <Badge label={c.name} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#ccc', fontVariantNumeric: 'tabular-nums', flex: 1 }}>{c.total.toLocaleString()}</span>
                  <Trend current={c.total} prev={c.prev} />
                  <span style={{ fontSize: 11, color: '#444', width: 36, textAlign: 'right' }}>{c.pct}%</span>
                </div>
                <div style={{ height: 3, background: '#1a1a1a', borderRadius: 3 }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={ready ? { width: `${c.pct}%` } : { width: 0 }}
                    transition={{ delay: 0.55 + i * 0.06, duration: 0.7, ease: 'easeOut' }}
                    style={{ height: '100%', background: CATEGORY_COLORS[c.name] || '#3b82f6', borderRadius: 3, opacity: 0.8 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Top source IPs + export */}
        <motion.div {...fadeUp(0.48, ready)} style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#ccc' }}>Top Attack Sources</span>
            <motion.button
              whileHover={{ borderColor: '#3b82f6', color: '#3b82f6' }}
              whileTap={{ scale: 0.95 }}
              onClick={downloadReport}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'transparent', border: '1px solid #2a2a2a',
                borderRadius: 6, padding: '5px 12px',
                color: '#666', fontSize: 12, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <Download size={12} /> Export
            </motion.button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1f1f1f' }}>
                {['#', 'IP Address', 'Type', 'Events'].map(h => (
                  <th key={h} style={{ padding: '0 0 10px', textAlign: 'left', fontSize: 11, color: '#333', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topIPs.map((ip, i) => (
                <motion.tr key={ip.ip}
                  initial={{ opacity: 0, x: 10 }}
                  animate={ready ? { opacity: 1, x: 0 } : { opacity: 0, x: 10 }}
                  transition={{ delay: 0.55 + i * 0.06 }}
                  style={{ borderTop: i > 0 ? '1px solid #1a1a1a' : 'none' }}
                >
                  <td style={{ padding: '9px 0', fontSize: 11, color: '#333' }}>{i + 1}</td>
                  <td style={{ padding: '9px 0', fontSize: 12, color: '#888', fontFamily: 'monospace' }}>{ip.ip}</td>
                  <td style={{ padding: '9px 0' }}><Badge label={ip.type} /></td>
                  <td style={{ padding: '9px 0', fontSize: 12, color: '#ccc', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{ip.count}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </div>
  )
}

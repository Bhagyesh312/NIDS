import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus, FileText } from 'lucide-react'
import Header from '../components/Header'
import Badge from '../components/Badge'
import { CATEGORY_COLORS, CATEGORIES, CICIDS_ATTACK_CATEGORIES, getLabelColor } from '../lib/colors'
import { useReady } from '../lib/readyContext'
import { getReports } from '../lib/api'
import { useMockMode } from '../lib/mockModeContext'
import { useModel } from '../lib/modelContext'

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

// ── Helpers ──────────────────────────────────────────────────────────────────

const card = { background: '#161616', border: '1px solid #1f1f1f', borderRadius: 8, padding: '18px 20px' }

const fadeUp = (delay = 0, ready = true) => ({
  initial: { opacity: 0, y: 14 },
  animate: ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
  transition: { duration: 0.4, delay, ease: 'easeOut' },
})

// helper: #rrggbb → [r,g,b]  (module-level so it's not re-created on every render)
function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return m ? [parseInt(m[1],16), parseInt(m[2],16), parseInt(m[3],16)] : null
}

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
  const { mockMode }    = useMockMode()
  const { activeModel } = useModel()
  useEffect(() => { document.title = 'NIDS · Reports' }, [])

  const isCicids     = activeModel === 'cicids'
  const normalLabel  = isCicids ? 'Benign' : 'Normal'
  // The attack categories to render bars for
  const attackCats   = isCicids ? CICIDS_ATTACK_CATEGORIES : CATEGORIES.filter(c => c !== 'Normal')

  // ── State — resets when model changes ─────────────────────────────────────
  const defaultCategoryStats = useMemo(() => isCicids
    ? [
        { name: 'DoS',        total: 87000,   prev: 82650,  pct: 62.1 },
        { name: 'DDoS',       total: 41835,   prev: 39743,  pct: 29.8 },
        { name: 'PortScan',   total: 10000,   prev: 9500,   pct: 7.1  },
        { name: 'BruteForce', total: 1000,    prev: 950,    pct: 0.7  },
        { name: 'Bot',        total: 365,     prev: 347,    pct: 0.3  },
      ]
    : [
        { name: 'DoS',    total: 347,   prev: 338,   pct: 53.4 },
        { name: 'Probe',  total: 121,   prev: 98,    pct: 18.6 },
        { name: 'R2L',    total: 40,    prev: 44,    pct: 6.2  },
        { name: 'U2R',    total: 11,    prev: 9,     pct: 1.7  },
      ],
  [isCicids])

  const [categoryStats, setCategoryStats] = useState(defaultCategoryStats)
  const [topIPs,         setTopIPs]        = useState([
    { ip: '192.168.1.104', count: 84, type: 'DoS'   },
    { ip: '172.16.0.55',   count: 56, type: 'Probe' },
    { ip: '10.10.1.88',    count: 48, type: 'DoS'   },
    { ip: '203.0.113.42',  count: 31, type: 'R2L'   },
    { ip: '198.51.100.23', count: 29, type: 'DoS'   },
  ])
  const [weeklyData,    setWeeklyData]    = useState(weekly)
  const [monthlyData,   setMonthlyData]   = useState(monthly)
  const [detectionRate, setDetectionRate] = useState(isCicids ? '99.85%' : '99.92%')

  // Reset to model-appropriate defaults immediately on switch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCategoryStats(defaultCategoryStats)
    setWeeklyData(weekly)
    setMonthlyData(monthly)
    setDetectionRate(isCicids ? '99.85%' : '99.92%')
  }, [activeModel, defaultCategoryStats, isCicids])

  // Fetch from API — re-runs when model or mock mode changes
  useEffect(() => {
    if (mockMode) return
    getReports(activeModel)
      .then(res => {
        const d = res.data

        if (d.category_stats?.length) {
          // Only keep attack categories (exclude normal labels)
          const attackOnly = d.category_stats.filter(
            c => c.name !== 'Normal' && c.name !== 'Benign'
          )
          const total = attackOnly.reduce((s, c) => s + c.total, 0)
          if (attackOnly.length) {
            setCategoryStats(attackOnly.map(c => ({
              ...c,
              prev: Math.round(c.total * 0.95),
              pct:  total > 0 ? parseFloat(((c.total / total) * 100).toFixed(1)) : 0,
            })))
          }
        }

        if (d.top_ips?.length) {
          setTopIPs(d.top_ips.map(ip => ({ ip: ip.ip, count: ip.count, type: ip.type })))
        }

        // Build weekly chart — dynamic keys from attack categories
        if (d.daily?.length) {
          const dayMap = {}
          d.daily.forEach(row => {
            if (row.type === normalLabel) return
            const label = new Date(row.day + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })
            if (!dayMap[label]) {
              dayMap[label] = { day: label }
              attackCats.forEach(c => { dayMap[label][c] = 0 })
            }
            if (row.type in dayMap[label]) dayMap[label][row.type] += row.count
          })
          const built = Object.values(dayMap).slice(-7)
          if (built.length) setWeeklyData(built)
        }

        if (d.monthly?.length) setMonthlyData(d.monthly)
        if (d.detection_rate) setDetectionRate(d.detection_rate)
      })
      .catch(() => {})
  }, [mockMode, activeModel, attackCats, normalLabel])

  const totalAttacks = categoryStats.reduce((s, c) => s + c.total, 0)
  const thisWeek     = weeklyData.reduce((s, d) => {
    return s + attackCats.reduce((sum, cat) => sum + (d[cat] || 0), 0)
  }, 0)

  // ── PDF export ────────────────────────────────────────────────
  const [pdfLoading, setPdfLoading] = useState(false)

  const exportPDF = async () => {
    setPdfLoading(true)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = doc.internal.pageSize.getWidth()
      const margin = 18
      let y = 20

      // ── Header ──────────────────────────────────────────────
      doc.setFillColor(15, 15, 15)
      doc.rect(0, 0, pageW, 36, 'F')
      doc.setFontSize(20)
      doc.setTextColor(240, 240, 240)
      doc.setFont('helvetica', 'bold')
      doc.text('NIDS Security Report', margin, 16)
      doc.setFontSize(9)
      doc.setTextColor(100, 100, 100)
      doc.setFont('helvetica', 'normal')
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 24)
      doc.text(`Detection Rate: ${detectionRate}`, pageW - margin, 24, { align: 'right' })
      y = 48

      // ── Summary stat boxes ───────────────────────────────────
      const boxes = [
        { label: 'Total Attacks',  value: totalAttacks.toLocaleString(), color: [239, 68, 68]  },
        { label: 'This Week',      value: thisWeek.toLocaleString(),     color: [56, 189, 248] },
        { label: 'Avg / Day',      value: Math.round(thisWeek / 7),      color: [245, 158, 11] },
        { label: 'Detection Rate', value: detectionRate,                 color: [59, 130, 246] },
      ]
      const boxW = (pageW - margin * 2 - 9) / 4
      boxes.forEach((b, i) => {
        const bx = margin + i * (boxW + 3)
        doc.setFillColor(22, 22, 22)
        doc.roundedRect(bx, y, boxW, 22, 3, 3, 'F')
        doc.setFontSize(8)
        doc.setTextColor(80, 80, 80)
        doc.setFont('helvetica', 'normal')
        doc.text(b.label, bx + 4, y + 8)
        doc.setFontSize(14)
        doc.setTextColor(...b.color)
        doc.setFont('helvetica', 'bold')
        doc.text(String(b.value), bx + 4, y + 18)
      })
      y += 30

      // ── Category breakdown ───────────────────────────────────
      doc.setFontSize(11)
      doc.setTextColor(200, 200, 200)
      doc.setFont('helvetica', 'bold')
      doc.text('Category Breakdown', margin, y)
      y += 6

      const barMaxW = pageW - margin * 2 - 60
      categoryStats.forEach((c) => {
        if (y > 260) { doc.addPage(); y = 20 }
        const pct = c.pct || 0
        const col = getLabelColor(c.name)
        const rgb = hexToRgb(col)

        doc.setFontSize(9)
        doc.setTextColor(140, 140, 140)
        doc.setFont('helvetica', 'normal')
        doc.text(c.name, margin, y + 4)
        doc.text(c.total.toLocaleString(), margin + 42, y + 4)
        doc.text(`${pct}%`, pageW - margin, y + 4, { align: 'right' })

        // background bar
        doc.setFillColor(30, 30, 30)
        doc.roundedRect(margin + 56, y, barMaxW, 5, 1, 1, 'F')
        // filled bar
        if (pct > 0 && rgb) {
          doc.setFillColor(...rgb)
          doc.roundedRect(margin + 56, y, (pct / 100) * barMaxW, 5, 1, 1, 'F')
        }
        y += 11
      })
      y += 4

      // ── Monthly trend table ──────────────────────────────────
      if (monthlyData.length) {
        if (y > 240) { doc.addPage(); y = 20 }
        doc.setFontSize(11)
        doc.setTextColor(200, 200, 200)
        doc.setFont('helvetica', 'bold')
        doc.text('Monthly Trend', margin, y)
        y += 6

        const colW = (pageW - margin * 2) / 3
        const normalColLabel = isCicids ? 'Benign' : 'Normal'
        const monthHeaders = [`Month`, 'Attacks', normalColLabel]
        monthHeaders.forEach((h, i) => {
          doc.setFontSize(8)
          doc.setTextColor(80, 80, 80)
          doc.setFont('helvetica', 'normal')
          doc.text(h, margin + i * colW, y)
        })
        y += 5
        doc.setDrawColor(30, 30, 30)
        doc.line(margin, y, pageW - margin, y)
        y += 4

        monthlyData.forEach((m) => {
          if (y > 270) { doc.addPage(); y = 20 }
          doc.setFontSize(9)
          doc.setTextColor(160, 160, 160)
          doc.text(m.month,              margin,          y)
          doc.setTextColor(239, 68, 68)
          doc.text(String(m.attacks),    margin + colW,   y)
          doc.setTextColor(34, 197, 94)
          doc.text(String(m.normal),     margin + colW * 2, y)
          y += 7
        })
        y += 4
      }

      // ── Top source IPs ───────────────────────────────────────
      if (topIPs.length) {
        if (y > 240) { doc.addPage(); y = 20 }
        doc.setFontSize(11)
        doc.setTextColor(200, 200, 200)
        doc.setFont('helvetica', 'bold')
        doc.text('Top Attack Sources', margin, y)
        y += 6

        const ipColW = (pageW - margin * 2) / 4
        const ipHeaders = ['#', 'IP Address', 'Type', 'Events']
        ipHeaders.forEach((h, i) => {
          doc.setFontSize(8)
          doc.setTextColor(80, 80, 80)
          doc.setFont('helvetica', 'normal')
          doc.text(h, margin + i * ipColW, y)
        })
        y += 5
        doc.line(margin, y, pageW - margin, y)
        y += 4

        topIPs.forEach((ip, i) => {
          if (y > 270) { doc.addPage(); y = 20 }
          const col = getLabelColor(ip.type)
          const rgb = hexToRgb(col)
          doc.setFontSize(9)
          doc.setTextColor(80, 80, 80)
          doc.text(String(i + 1),   margin,              y)
          doc.setTextColor(136, 136, 136)
          doc.text(ip.ip,           margin + ipColW,     y)
          if (rgb) doc.setTextColor(...rgb)
          else     doc.setTextColor(136, 136, 136)
          doc.text(ip.type,         margin + ipColW * 2, y)
          doc.setTextColor(200, 200, 200)
          doc.text(String(ip.count), margin + ipColW * 3, y)
          y += 7
        })
      }

      // ── Footer ───────────────────────────────────────────────
      const pageCount = doc.internal.getNumberOfPages()
      for (let p = 1; p <= pageCount; p++) {
        doc.setPage(p)
        doc.setFontSize(7)
        doc.setTextColor(50, 50, 50)
        doc.text(
          `NIDS Dashboard · Page ${p} of ${pageCount} · Confidential`,
          pageW / 2, 292,
          { align: 'center' }
        )
      }

      doc.save(`nids_report_${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (e) {
      console.error('PDF export failed:', e)
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div>
      <Header title="Reports" subtitle="Security summary and attack trend analysis" />

      {/* Summary stat row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>
        {[
          { label: 'Total Attacks',  value: totalAttacks.toLocaleString(),      color: CATEGORY_COLORS.DoS   },
          { label: 'This Week',      value: thisWeek.toLocaleString(),           color: CATEGORY_COLORS.Probe },
          { label: 'Avg / Day',      value: Math.round(thisWeek / 7),            color: CATEGORY_COLORS.R2L   },
          { label: 'Detection Rate', value: detectionRate,                        color: '#3b82f6'             },
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
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {attackCats.slice(0, 6).map(c => (
                <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: getLabelColor(c), display: 'inline-block' }} />
                  <span style={{ fontSize: 10, color: '#555' }}>{c.replace('Web Attack \uFFFD ', 'Web/')}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData} barSize={isCicids ? 6 : 12} barGap={2} margin={{ left: -16, right: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#1f1f1f" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: '#333', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#333', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<TT />} cursor={<DarkCursor />} />
              {attackCats.map(c => (
                <Bar key={c} dataKey={c} shape={GlowBar(getLabelColor(c))}
                  radius={[4,4,0,0]} name={c.replace('Web Attack \uFFFD ', 'Web/')} animationDuration={800} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Monthly trend */}
        <motion.div {...fadeUp(0.35, ready)} style={card}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#ccc', marginBottom: 16 }}>Monthly Attack Trend</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyData} margin={{ left: -16, right: 8, top: 4 }}>
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
                    style={{ height: '100%', background: getLabelColor(c.name), borderRadius: 3, opacity: 0.8 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Top source IPs + PDF export */}
        <motion.div {...fadeUp(0.48, ready)} style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#ccc' }}>Top Attack Sources</span>
            <motion.button
              whileHover={{ borderColor: '#3b82f6', color: '#3b82f6' }}
              whileTap={{ scale: 0.95 }}
              onClick={exportPDF}
              disabled={pdfLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'transparent', border: '1px solid #2a2a2a',
                borderRadius: 6, padding: '5px 12px',
                color: '#666', fontSize: 12, cursor: 'pointer',
                transition: 'all 0.15s', opacity: pdfLoading ? 0.5 : 1,
              }}
            >
              <FileText size={12} /> {pdfLoading ? 'Generating…' : 'Export PDF'}
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

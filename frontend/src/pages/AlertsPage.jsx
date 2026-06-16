import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Download, Filter, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react'
import Header from '../components/Header'
import Badge from '../components/Badge'
import { CATEGORY_COLORS, CATEGORIES } from '../lib/colors'
import { SkeletonTableRow } from '../components/Skeleton'
import { getAlerts } from '../lib/api'

// ── Mock fallback data (used when backend is offline) ─────────────────────────
const MOCK_ALERTS = [
  { id: 1,  type: 'DoS',    src: '192.168.1.104', dst: '10.0.0.1',   port: 80,   proto: 'tcp', conf: 98.2, time: '2025-06-13 14:02:11', subtype: 'neptune' },
  { id: 2,  type: 'Probe',  src: '172.16.0.55',   dst: '10.0.0.5',   port: 22,   proto: 'tcp', conf: 94.7, time: '2025-06-13 13:58:44', subtype: 'portsweep' },
  { id: 3,  type: 'R2L',    src: '203.0.113.42',  dst: '10.0.0.12',  port: 21,   proto: 'tcp', conf: 89.1, time: '2025-06-13 13:51:30', subtype: 'ftp_write' },
  { id: 4,  type: 'DoS',    src: '198.51.100.23', dst: '10.0.0.1',   port: 80,   proto: 'tcp', conf: 97.5, time: '2025-06-13 13:45:09', subtype: 'smurf' },
  { id: 5,  type: 'Probe',  src: '192.168.1.200', dst: '10.0.0.8',   port: 443,  proto: 'tcp', conf: 91.3, time: '2025-06-13 13:34:22', subtype: 'nmap' },
  { id: 6,  type: 'U2R',    src: '10.0.0.99',     dst: '10.0.0.3',   port: 0,    proto: 'tcp', conf: 83.6, time: '2025-06-13 13:20:55', subtype: 'buffer_overflow' },
  { id: 7,  type: 'DoS',    src: '10.10.1.88',    dst: '10.0.0.2',   port: 80,   proto: 'udp', conf: 96.1, time: '2025-06-13 13:15:03', subtype: 'back' },
  { id: 8,  type: 'R2L',    src: '172.20.5.11',   dst: '10.0.0.6',   port: 143,  proto: 'tcp', conf: 87.4, time: '2025-06-13 13:08:17', subtype: 'imap' },
  { id: 9,  type: 'Probe',  src: '10.0.3.77',     dst: '10.0.0.9',   port: 25,   proto: 'tcp', conf: 92.8, time: '2025-06-13 12:59:44', subtype: 'ipsweep' },
  { id: 10, type: 'U2R',    src: '10.0.2.33',     dst: '10.0.0.9',   port: 0,    proto: 'tcp', conf: 81.2, time: '2025-06-13 12:44:31', subtype: 'rootkit' },
  { id: 11, type: 'DoS',    src: '203.0.113.7',   dst: '10.0.0.1',   port: 80,   proto: 'icmp',conf: 99.1, time: '2025-06-13 12:33:19', subtype: 'teardrop' },
  { id: 12, type: 'R2L',    src: '198.51.100.8',  dst: '10.0.0.14',  port: 161,  proto: 'udp', conf: 85.0, time: '2025-06-13 12:21:05', subtype: 'snmpguess' },
  { id: 13, type: 'Probe',  src: '172.16.0.99',   dst: '10.0.0.7',   port: 53,   proto: 'udp', conf: 88.4, time: '2025-06-13 12:10:48', subtype: 'satan' },
  { id: 14, type: 'DoS',    src: '10.5.0.11',     dst: '10.0.0.1',   port: 8080, proto: 'tcp', conf: 95.3, time: '2025-06-13 12:01:33', subtype: 'apache2' },
  { id: 15, type: 'U2R',    src: '10.0.1.45',     dst: '10.0.0.5',   port: 0,    proto: 'tcp', conf: 79.8, time: '2025-06-13 11:55:12', subtype: 'perl' },
  { id: 16, type: 'R2L',    src: '203.0.113.55',  dst: '10.0.0.11',  port: 21,   proto: 'tcp', conf: 91.7, time: '2025-06-13 11:44:09', subtype: 'guess_passwd' },
  { id: 17, type: 'Probe',  src: '192.168.2.100', dst: '10.0.0.3',   port: 22,   proto: 'tcp', conf: 93.2, time: '2025-06-13 11:30:27', subtype: 'mscan' },
  { id: 18, type: 'DoS',    src: '10.10.2.200',   dst: '10.0.0.2',   port: 80,   proto: 'tcp', conf: 97.8, time: '2025-06-13 11:18:55', subtype: 'neptune' },
  { id: 19, type: 'R2L',    src: '172.16.1.33',   dst: '10.0.0.8',   port: 25,   proto: 'tcp', conf: 84.3, time: '2025-06-13 11:05:41', subtype: 'sendmail' },
  { id: 20, type: 'U2R',    src: '10.0.0.77',     dst: '10.0.0.4',   port: 0,    proto: 'tcp', conf: 86.5, time: '2025-06-13 10:52:18', subtype: 'sqlattack' },
]

// Normalize backend response to match the table format
function normalizeAlert(a) {
  return {
    id:      a.id,
    type:    a.prediction,
    src:     a.src_ip   || '—',
    dst:     a.dst_ip   || '—',
    port:    0,
    proto:   a.protocol || '—',
    conf:    parseFloat((a.confidence * 100).toFixed(1)),
    time:    new Date(a.created_at).toLocaleString(),
    subtype: a.subtype  || a.prediction?.toLowerCase() || '—',
  }
}

const TYPE_FILTERS = ['All', ...CATEGORIES.filter(c => c !== 'Normal')]
const SORT_FIELDS  = ['time', 'conf', 'type', 'src']
const PAGE_SIZE    = 10

function SortIcon({ field, sortBy, sortDir }) {
  if (sortBy !== field) return <ChevronUp size={12} color="#333" />
  return sortDir === 'asc'
    ? <ChevronUp size={12} color="#3b82f6" />
    : <ChevronDown size={12} color="#3b82f6" />
}

export default function AlertsPage() {
  const [rawAlerts, setRawAlerts] = useState(MOCK_ALERTS)
  const [search, setSearch]       = useState('')
  const [typeFilter, setFilter]   = useState('All')
  const [sortBy, setSortBy]       = useState('time')
  const [sortDir, setSortDir]     = useState('desc')
  const [page, setPage]           = useState(1)
  const [loading, setLoading]     = useState(true)

  useEffect(() => { document.title = 'NIDS · Alerts' }, [])

  const fetchAlerts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAlerts({ limit: 100 })
      if (res.data?.length) {
        setRawAlerts(res.data.map(normalizeAlert))
      }
      // If backend returns empty keep mock data
    } catch {
      // Backend offline — keep mock data silently
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAlerts() }, [fetchAlerts])

  const handleRefresh = () => fetchAlerts()

  const handleSort = (field) => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(field); setSortDir('desc') }
    setPage(1)
  }

  const filtered = useMemo(() => {
    let data = rawAlerts
    if (typeFilter !== 'All') data = data.filter(a => a.type === typeFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      data = data.filter(a =>
        a.src.includes(q) || a.dst.includes(q) ||
        a.type.toLowerCase().includes(q) || a.subtype.toLowerCase().includes(q)
      )
    }
    data = [...data].sort((a, b) => {
      let av = a[sortBy], bv = b[sortBy]
      if (typeof av === 'string') av = av.toLowerCase()
      if (typeof bv === 'string') bv = bv.toLowerCase()
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
    })
    return data
  }, [search, typeFilter, sortBy, sortDir])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const downloadCSV = () => {
    const header = 'ID,Type,Subtype,Source,Destination,Port,Protocol,Confidence,Time\n'
    const rows = filtered.map(a =>
      `${a.id},${a.type},${a.subtype},${a.src},${a.dst},${a.port},${a.proto},${a.conf}%,${a.time}`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const el = document.createElement('a')
    el.href = URL.createObjectURL(blob)
    el.download = 'nids_alerts.csv'
    el.click()
  }

  const col = (label, field) => (
    <th
      onClick={() => handleSort(field)}
      style={{ padding: '0 12px 10px 0', textAlign: 'left', fontSize: 11, color: '#555', fontWeight: 500, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {label} <SortIcon field={field} sortBy={sortBy} sortDir={sortDir} />
      </span>
    </th>
  )

  return (
    <div>
      <Header title="Alerts" subtitle={`${filtered.length} intrusion events detected`} />

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200,
          background: '#161616', border: '1px solid #1f1f1f', borderRadius: 7, padding: '7px 12px',
        }}>
          <Search size={13} color="#444" />
          <input
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search IP, type, subtype..."
            style={{ background: 'none', border: 'none', outline: 'none', color: '#ccc', fontSize: 13, width: '100%', fontFamily: 'Inter, sans-serif' }}
          />
        </div>

        {/* Type filter pills */}
        <div style={{ display: 'flex', gap: 4 }}>
          {TYPE_FILTERS.map(f => (
            <motion.button key={f} whileTap={{ scale: 0.95 }}
              onClick={() => { setFilter(f); setPage(1) }}
              style={{
                background: typeFilter === f ? (f === 'All' ? '#1f1f1f' : `${CATEGORY_COLORS[f]}18`) : 'transparent',
                border: `1px solid ${typeFilter === f ? (f === 'All' ? '#3b3b3b' : CATEGORY_COLORS[f] + '40') : '#2a2a2a'}`,
                borderRadius: 5, padding: '5px 11px',
                color: typeFilter === f ? (f === 'All' ? '#ccc' : CATEGORY_COLORS[f]) : '#555',
                fontSize: 11, fontWeight: typeFilter === f ? 600 : 400, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >{f}</motion.button>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6 }}>
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleRefresh}
            style={{ background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', color: '#555', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
            <RefreshCw size={13} /> Refresh
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={downloadCSV}
            style={{ background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
            <Download size={13} /> Export CSV
          </motion.button>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#161616', border: '1px solid #1f1f1f', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ borderBottom: '1px solid #1f1f1f' }}>
            <tr style={{ padding: '0 20px' }}>
              <th style={{ padding: '12px 0 10px 20px', textAlign: 'left', fontSize: 11, color: '#555', fontWeight: 500, width: 36 }}>#</th>
              {col('Type',       'type')}
              {col('Subtype',    'subtype')}
              {col('Source IP',  'src')}
              <th style={{ padding: '0 12px 10px 0', textAlign: 'left', fontSize: 11, color: '#555', fontWeight: 500 }}>Destination</th>
              <th style={{ padding: '0 12px 10px 0', textAlign: 'left', fontSize: 11, color: '#555', fontWeight: 500 }}>Port · Proto</th>
              {col('Confidence', 'conf')}
              {col('Time',       'time')}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonTableRow key={i} />)
              : (
                <AnimatePresence mode="popLayout">
                  {paged.length === 0
                    ? (
                      <tr>
                        <td colSpan={8} style={{ padding: '40px 20px', textAlign: 'center', color: '#333', fontSize: 13 }}>
                          No alerts match your filters
                        </td>
                      </tr>
                    )
                    : paged.map((a, i) => (
                      <motion.tr
                        key={a.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.2 }}
                        whileHover={{ backgroundColor: '#1a1a1a' }}
                        style={{ borderTop: '1px solid #1a1a1a' }}
                      >
                        <td style={{ padding: '10px 0 10px 20px', fontSize: 11, color: '#333', fontVariantNumeric: 'tabular-nums' }}>{a.id}</td>
                        <td style={{ padding: '10px 12px 10px 0' }}><Badge label={a.type} /></td>
                        <td style={{ padding: '10px 12px 10px 0', fontSize: 12, color: '#666', fontFamily: 'monospace' }}>{a.subtype}</td>
                        <td style={{ padding: '10px 12px 10px 0', fontSize: 12, color: '#888', fontFamily: 'monospace' }}>{a.src}</td>
                        <td style={{ padding: '10px 12px 10px 0', fontSize: 12, color: '#555', fontFamily: 'monospace' }}>{a.dst}</td>
                        <td style={{ padding: '10px 12px 10px 0', fontSize: 12, color: '#555' }}>
                          <span style={{ fontFamily: 'monospace' }}>{a.port || '—'}</span>
                          <span style={{ color: '#333', marginLeft: 5 }}>· {a.proto}</span>
                        </td>
                        <td style={{ padding: '10px 12px 10px 0' }}>
                          <span style={{
                            fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
                            color: a.conf >= 95 ? CATEGORY_COLORS.DoS : a.conf >= 88 ? CATEGORY_COLORS.R2L : '#ccc'
                          }}>{a.conf.toFixed(1)}%</span>
                        </td>
                        <td style={{ padding: '10px 20px 10px 0', fontSize: 11, color: '#444', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{a.time}</td>
                      </motion.tr>
                    ))
                  }
                </AnimatePresence>
              )
            }
          </tbody>
        </table>

        {/* Pagination */}
        {!loading && filtered.length > PAGE_SIZE && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 20px', borderTop: '1px solid #1a1a1a',
          }}>
            <span style={{ fontSize: 12, color: '#444' }}>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <motion.button key={p} whileTap={{ scale: 0.9 }} onClick={() => setPage(p)}
                  style={{
                    width: 28, height: 28, borderRadius: 5, border: `1px solid ${p === page ? '#3b82f6' : '#2a2a2a'}`,
                    background: p === page ? 'rgba(59,130,246,0.1)' : 'transparent',
                    color: p === page ? '#3b82f6' : '#555', fontSize: 12, cursor: 'pointer',
                    fontWeight: p === page ? 600 : 400,
                  }}>{p}</motion.button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

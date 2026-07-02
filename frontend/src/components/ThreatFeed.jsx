import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, Pause, Play } from 'lucide-react'
import { CATEGORY_COLORS, getLabelColor } from '../lib/colors'
import { useMockMode } from '../lib/mockModeContext'
import { useRefreshSettings } from '../lib/refreshContext'
import { useModel } from '../lib/modelContext'
import { getAlerts } from '../lib/api'

// ── KDD mock data ─────────────────────────────────────────────
const KDD_ATTACKS   = ['DoS', 'Probe', 'R2L', 'U2R']
const KDD_SUBTYPES  = {
  DoS:   ['neptune flood', 'smurf attack', 'back overflow', 'teardrop frag', 'apache2 exploit'],
  Probe: ['portsweep', 'nmap scan', 'ipsweep', 'satan probe', 'mscan'],
  R2L:   ['guess_passwd', 'ftp_write', 'imap exploit', 'snmpguess', 'warezmaster'],
  U2R:   ['buffer_overflow', 'rootkit install', 'perl exploit', 'sqlattack', 'xterm hijack'],
}

// ── CICIDS mock data ──────────────────────────────────────────
const CICIDS_ATTACKS  = ['DoS', 'DDoS', 'PortScan', 'BruteForce', 'Bot', 'Infiltration']
const CICIDS_SUBTYPES = {
  DoS:         ['slowloris', 'hulk', 'goldeneye', 'slowhttptest'],
  DDoS:        ['LOIT flood', 'UDP amplification', 'SYN flood'],
  PortScan:    ['stealth scan', 'aggressive scan', 'service version detect'],
  BruteForce:  ['FTP brute force', 'SSH brute force', 'HTTP brute force'],
  Bot:         ['C&C beacon', 'data exfil', 'bot propagation'],
  Infiltration: ['Cool disk infiltration', 'lateral movement'],
}

const PORTS  = [80, 443, 22, 21, 25, 53, 3306, 8080, 8443, 3389]
const NORMAL_MSGS = ['HTTP request', 'DNS query', 'HTTPS handshake', 'TCP established', 'ICMP ping']

function randIP() { return `${rand(1,254)}.${rand(0,255)}.${rand(0,255)}.${rand(1,254)}` }
function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a }

function genMockEntry(model = 'kdd') {
  const isAttack = Math.random() < 0.38
  const ts = new Date().toTimeString().split(' ')[0]

  if (!isAttack) {
    return {
      id: Date.now() + Math.random(), ts,
      type: 'normal', label: model === 'cicids' ? 'BENIGN' : 'OK',
      msg: `${NORMAL_MSGS[rand(0, NORMAL_MSGS.length - 1)]} — ${randIP()} → 10.0.0.${rand(1,20)}:${PORTS[rand(0,PORTS.length - 1)]}`,
    }
  }

  const attacks  = model === 'cicids' ? CICIDS_ATTACKS  : KDD_ATTACKS
  const subtypes = model === 'cicids' ? CICIDS_SUBTYPES : KDD_SUBTYPES
  const attack   = attacks[rand(0, attacks.length - 1)]
  const subs     = subtypes[attack] || ['unknown attack']
  const sub      = subs[rand(0, subs.length - 1)]
  const conf     = (rand(820, 999) / 10).toFixed(1)

  return {
    id: Date.now() + Math.random(), ts,
    type: 'attack', attack, label: attack,
    msg: `${sub} detected — ${randIP()} → 10.0.0.${rand(1,20)}  conf:${conf}%`,
  }
}

// Convert a DB alert row into a feed entry
function alertToEntry(a) {
  const normalLabels = ['Normal', 'Benign']
  const isAttack     = !normalLabels.includes(a.prediction)
  const ts           = new Date(a.created_at).toTimeString().split(' ')[0]
  return {
    id:     String(a.id) + '-' + a.created_at,
    ts,
    type:   isAttack ? 'attack' : 'normal',
    attack: isAttack ? a.prediction : undefined,
    label:  isAttack ? a.prediction : (a.model_used === 'cicids' ? 'BENIGN' : 'OK'),
    msg:    isAttack
      ? `${a.prediction.toLowerCase()} detected — ${a.src_ip || '?.?.?.?'} → ${a.dst_ip || '—'}  conf:${(a.confidence * 100).toFixed(1)}%`
      : `normal traffic — ${a.src_ip || '—'} → ${a.dst_ip || '—'}  conf:${(a.confidence * 100).toFixed(1)}%`,
  }
}

export default function ThreatFeed({ open }) {
  const { mockMode }                 = useMockMode()
  const { autoRefresh, refreshRate } = useRefreshSettings()
  const { activeModel }              = useModel()

  const [entries, setEntries]         = useState([])
  const [paused, setPaused]           = useState(false)
  const [attackFlash, setAttackFlash] = useState(false)
  const bottomRef                     = useRef(null)
  const pausedRef                     = useRef(false)
  const prevAttackCount               = useRef(0)
  const seenIdsRef                    = useRef(new Set())

  pausedRef.current = paused  // eslint-disable-line react-hooks/refs

  // ── Seed entries on open or model change ─────────────────────
  useEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEntries([])
    seenIdsRef.current.clear()

    if (mockMode) {
      setEntries(Array.from({ length: 12 }, () => genMockEntry(activeModel)))
    } else {
      getAlerts({ limit: 40, model: activeModel })
        .then(res => {
          if (res.data?.length) {
            const mapped = [...res.data].reverse().map(alertToEntry)
            seenIdsRef.current = new Set(mapped.map(e => e.id))
            setEntries(mapped)
          }
        })
        .catch(() => {
          setEntries(Array.from({ length: 12 }, () => genMockEntry(activeModel)))
        })
    }
  }, [open, mockMode, activeModel])

  // ── Demo mode: random ticker ──────────────────────────────────
  useEffect(() => {
    if (!open || !mockMode) return
    let timer
    const tick = () => {
      if (!pausedRef.current) {
        setEntries(prev => [...prev, genMockEntry(activeModel)].slice(-80))
      }
      timer = setTimeout(tick, rand(700, 2000))
    }
    timer = setTimeout(tick, rand(700, 2000))
    return () => clearTimeout(timer)
  }, [open, mockMode, activeModel])

  // ── API mode: poll for new rows ───────────────────────────────
  const fetchNew = useCallback(() => {
    if (pausedRef.current || mockMode) return
    getAlerts({ limit: 20, model: activeModel })
      .then(res => {
        if (!res.data?.length) return
        const fresh = res.data
          .map(alertToEntry)
          .filter(e => !seenIdsRef.current.has(e.id))
        if (fresh.length) {
          fresh.forEach(e => seenIdsRef.current.add(e.id))
          setEntries(prev => [...prev, ...fresh.reverse()].slice(-80))
        }
      })
      .catch(() => {})
  }, [mockMode, activeModel])

  useEffect(() => {
    if (!open || mockMode || !autoRefresh) return
    const ms = parseInt(refreshRate, 10) * 1000
    const id = setInterval(fetchNew, ms)
    return () => clearInterval(id)
  }, [open, mockMode, autoRefresh, refreshRate, fetchNew])

  // ── Auto-scroll ───────────────────────────────────────────────
  useEffect(() => {
    if (!paused) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries, paused])

  // ── Flash on new attack ───────────────────────────────────────
  const attackCount = entries.filter(e => e.type === 'attack').length
  useEffect(() => {
    if (attackCount > prevAttackCount.current) {
      setAttackFlash(true)
      setTimeout(() => setAttackFlash(false), 400)
    }
    prevAttackCount.current = attackCount
  }, [attackCount])

  if (!open) return null

  const modelLabel = activeModel === 'cicids' ? 'CICIDS2017' : 'NSL-KDD'

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        position: 'fixed', top: 0, right: 0,
        width: 440, height: '100vh',
        background: '#0a0a0a',
        borderLeft: '1px solid #1f1f1f',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.6)',
        zIndex: 300,
        display: 'flex', flexDirection: 'column',
        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
      }}
    >
      {/* Title bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '9px 12px', background: '#111',
        borderBottom: '1px solid #1a1a1a',
      }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {['#ff5f56', '#ffbd2e', '#27c93f'].map(c => (
            <span key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, display: 'inline-block' }} />
          ))}
        </div>
        <Terminal size={11} color="#444" style={{ marginLeft: 4 }} />
        <span style={{ fontSize: 11, color: '#444', flex: 1 }}>nids — threat-feed</span>
        {/* Model badge */}
        <span style={{
          fontSize: 9, fontWeight: 700, borderRadius: 3, padding: '1px 5px',
          background: activeModel === 'cicids' ? 'rgba(167,139,250,0.15)' : 'rgba(59,130,246,0.15)',
          color:      activeModel === 'cicids' ? '#a78bfa' : '#3b82f6',
        }}>
          {modelLabel}
        </span>
        <motion.span
          key={attackCount}
          animate={attackFlash ? { scale: [1, 1.3, 1], opacity: [1, 0.5, 1] } : {}}
          transition={{ duration: 0.3 }}
          style={{ fontSize: 10, color: CATEGORY_COLORS.DoS, fontFamily: 'monospace' }}
        >
          {attackCount} threats
        </motion.span>
        <button onClick={() => setPaused(p => !p)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: '#444' }}>
          {paused ? <Play size={12} /> : <Pause size={12} />}
        </button>
      </div>

      {/* Log area */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '8px 0',
        scrollbarWidth: 'thin', scrollbarColor: '#1a1a1a transparent',
      }}>
        <AnimatePresence initial={false}>
          {entries.map((e) => {
            const attackColor = e.type === 'attack' ? getLabelColor(e.attack) : CATEGORY_COLORS.Normal
            return (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  display: 'flex', alignItems: 'baseline', gap: 8,
                  padding: '2px 12px',
                  background: e.type === 'attack' ? `${attackColor}08` : 'transparent',
                }}
              >
                <span style={{ fontSize: 10, color: '#2a2a2a', flexShrink: 0, userSelect: 'none' }}>{e.ts}</span>
                <span style={{
                  fontSize: 9, fontWeight: 700,
                  color: e.type === 'normal' ? CATEGORY_COLORS.Normal : attackColor,
                  width: 52, flexShrink: 0, textTransform: 'uppercase',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {e.label}
                </span>
                <span style={{
                  fontSize: 11,
                  color: e.type === 'attack' ? attackColor : '#2a3a2a',
                  lineHeight: 1.6, wordBreak: 'break-all',
                }}>
                  {e.msg}
                </span>
              </motion.div>
            )
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Status bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '5px 12px', borderTop: '1px solid #1a1a1a', background: '#0d0d0d',
      }}>
        <motion.span
          animate={{ opacity: paused ? 1 : [1, 0, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          style={{ width: 5, height: 5, borderRadius: '50%', background: paused ? '#333' : CATEGORY_COLORS.Normal, display: 'inline-block' }}
        />
        <span style={{ fontSize: 9, color: '#2a2a2a' }}>
          {paused ? 'PAUSED' : mockMode ? 'DEMO' : 'LIVE'} · {entries.length} events
        </span>
        <span style={{ fontSize: 9, color: '#1a1a1a', marginLeft: 'auto' }}>
          NIDS v1.0 · {modelLabel}
        </span>
      </div>
    </motion.div>
  )
}

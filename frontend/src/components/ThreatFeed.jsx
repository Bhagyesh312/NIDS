import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, Pause, Play } from 'lucide-react'
import { CATEGORY_COLORS, CATEGORY_BG } from '../lib/colors'

const ATTACK_TYPES = ['DoS', 'Probe', 'R2L', 'U2R']
const SUBTYPES = {
  DoS:   ['neptune flood', 'smurf attack', 'back overflow', 'teardrop frag', 'apache2 exploit'],
  Probe: ['portsweep', 'nmap scan', 'ipsweep', 'satan probe', 'mscan'],
  R2L:   ['guess_passwd', 'ftp_write', 'imap exploit', 'snmpguess', 'warezmaster'],
  U2R:   ['buffer_overflow', 'rootkit install', 'perl exploit', 'sqlattack', 'xterm hijack'],
}
const PORTS  = [80, 443, 22, 21, 25, 53, 3306, 8080, 8443, 3389]
const NORMAL = ['HTTP request', 'DNS query', 'HTTPS handshake', 'TCP established', 'ICMP ping']

function randIP() {
  return `${rand(1,254)}.${rand(0,255)}.${rand(0,255)}.${rand(1,254)}`
}
function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a }

function genEntry() {
  const isAttack = Math.random() < 0.35
  const now = new Date()
  const ts = now.toTimeString().split(' ')[0]

  if (!isAttack) {
    return {
      id: Date.now() + Math.random(),
      ts,
      type: 'normal',
      label: 'OK',
      msg: `${NORMAL[rand(0, NORMAL.length-1)]} — ${randIP()} → 10.0.0.${rand(1,20)}:${PORTS[rand(0,PORTS.length-1)]}`,
    }
  }

  const attack = ATTACK_TYPES[rand(0, ATTACK_TYPES.length-1)]
  const sub    = SUBTYPES[attack][rand(0, SUBTYPES[attack].length-1)]
  const conf   = (rand(820, 999) / 10).toFixed(1)
  return {
    id: Date.now() + Math.random(),
    ts,
    type: 'attack',
    attack,
    label: attack,
    msg: `${sub} detected — ${randIP()} → 10.0.0.${rand(1,20)}  conf:${conf}%`,
  }
}

const COLORS = {
  DoS:    CATEGORY_COLORS.DoS,
  Probe:  CATEGORY_COLORS.Probe,
  R2L:    CATEGORY_COLORS.R2L,
  U2R:    CATEGORY_COLORS.U2R,
  normal: CATEGORY_BG.Normal,
}
const LABEL_COLORS = {
  DoS:    CATEGORY_COLORS.DoS,
  Probe:  CATEGORY_COLORS.Probe,
  R2L:    CATEGORY_COLORS.R2L,
  U2R:    CATEGORY_COLORS.U2R,
  normal: CATEGORY_COLORS.Normal,
}

export default function ThreatFeed({ open }) {
  const [entries, setEntries]         = useState([])
  const [paused, setPaused]           = useState(false)
  const [attackFlash, setAttackFlash] = useState(false)
  const bottomRef                     = useRef(null)
  const pausedRef                     = useRef(false)
  const prevAttackCount               = useRef(0)

  pausedRef.current = paused

  useEffect(() => {
    // Seed with initial entries
    const seed = Array.from({ length: 12 }, () => genEntry())
    setEntries(seed)
  }, [])

  useEffect(() => {
    const tick = () => {
      if (!pausedRef.current) {
        setEntries(prev => {
          const next = [...prev, genEntry()]
          return next.slice(-80) // keep last 80 lines
        })
      }
      timer = setTimeout(tick, rand(600, 2200))
    }
    let timer = setTimeout(tick, rand(600, 2200))
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!paused) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries, paused])

  const attackCount = entries.filter(e => e.type === 'attack').length

  useEffect(() => {
    if (attackCount > prevAttackCount.current) {
      setAttackFlash(true)
      setTimeout(() => setAttackFlash(false), 400)
    }
    prevAttackCount.current = attackCount
  }, [attackCount])

  if (!open) return null

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        top: 0, right: 0,
        width: 440,
        height: '100vh',
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
        padding: '9px 12px',
        background: '#111',
        borderBottom: '1px solid #1a1a1a',
      }}>
        {/* Traffic lights */}
        <div style={{ display: 'flex', gap: 5 }}>
          {['#ff5f56', '#ffbd2e', '#27c93f'].map(c => (
            <span key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, display: 'inline-block' }} />
          ))}
        </div>

        <Terminal size={11} color="#444" style={{ marginLeft: 4 }} />
        <span style={{ fontSize: 11, color: '#444', flex: 1 }}>nids — threat-feed</span>

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
        scrollbarWidth: 'thin',
        scrollbarColor: '#1a1a1a transparent',
      }}>
        <AnimatePresence initial={false}>
          {entries.map((e) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                display: 'flex', alignItems: 'baseline', gap: 8,
                padding: '2px 12px',
                background: e.type === 'attack' ? `${COLORS[e.attack]}08` : 'transparent',
              }}
            >
              {/* Timestamp */}
              <span style={{ fontSize: 10, color: '#2a2a2a', flexShrink: 0, userSelect: 'none' }}>
                {e.ts}
              </span>

              {/* Label */}
              <span style={{
                fontSize: 9, fontWeight: 700,
                color: LABEL_COLORS[e.type === 'normal' ? 'normal' : e.attack],
                width: 42, flexShrink: 0, textTransform: 'uppercase',
              }}>
                {e.label}
              </span>

              {/* Message */}
              <span style={{
                fontSize: 11,
                color: e.type === 'attack'
                  ? LABEL_COLORS[e.attack]
                  : '#2a3a2a',
                lineHeight: 1.6,
                wordBreak: 'break-all',
              }}>
                {e.msg}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Status bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '5px 12px',
        borderTop: '1px solid #1a1a1a',
        background: '#0d0d0d',
      }}>
        <motion.span
          animate={{ opacity: paused ? 1 : [1, 0, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          style={{ width: 5, height: 5, borderRadius: '50%', background: paused ? '#333' : CATEGORY_COLORS.Normal, display: 'inline-block' }}
        />
        <span style={{ fontSize: 9, color: '#2a2a2a' }}>
          {paused ? 'PAUSED' : 'LIVE'} · {entries.length} events
        </span>
        <span style={{ fontSize: 9, color: '#1a1a1a', marginLeft: 'auto' }}>
          NIDS v1.0 · KDD+
        </span>
      </div>
    </motion.div>
  )
}

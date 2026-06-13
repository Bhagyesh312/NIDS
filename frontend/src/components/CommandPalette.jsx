import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Bell, Upload, FileText, Settings,
  Crosshair, Search, ArrowRight, Hash, AlertTriangle,
  ShieldCheck, Activity, Brain, Command
} from 'lucide-react'

const commands = [
  {
    group: 'Navigation',
    items: [
      { id: 'dashboard', label: 'Go to Dashboard',   icon: LayoutDashboard, action: 'nav', to: '/' },
      { id: 'alerts',    label: 'Go to Alerts',       icon: Bell,            action: 'nav', to: '/alerts' },
      { id: 'batch',     label: 'Upload CSV',          icon: Upload,          action: 'nav', to: '/batch' },
      { id: 'reports',   label: 'Go to Reports',      icon: FileText,        action: 'nav', to: '/reports' },
      { id: 'settings',  label: 'Go to Settings',     icon: Settings,        action: 'nav', to: '/settings' },
      { id: 'predict',   label: 'Predict an attack',  icon: Crosshair,       action: 'nav', to: '/predict' },
      { id: 'model',     label: 'View Model Info',    icon: Brain,           action: 'nav', to: '/model' },
    ],
  },
  {
    group: 'Attack Types',
    items: [
      { id: 'dos',   label: 'DoS — Denial of Service',  icon: AlertTriangle, action: 'info', info: 'Floods the network to deny service. Subtypes: neptune, smurf, back, teardrop.' },
      { id: 'probe', label: 'Probe — Scanning',         icon: Activity,      action: 'info', info: 'Surveillance attacks that scan the network for vulnerabilities.' },
      { id: 'r2l',   label: 'R2L — Remote to Local',    icon: Hash,          action: 'info', info: 'Attacker exploits a vulnerability to gain local access from a remote machine.' },
      { id: 'u2r',   label: 'U2R — User to Root',       icon: ShieldCheck,   action: 'info', info: 'Local user gains root/superuser privileges.' },
    ],
  },
]

const flat = commands.flatMap(g => g.items)

export default function CommandPalette() {
  const [open, setOpen]       = useState(false)
  const [query, setQuery]     = useState('')
  const [selected, setSelected] = useState(0)
  const [info, setInfo]       = useState(null)
  const inputRef              = useRef(null)
  const navigate              = useNavigate()

  const filtered = query.trim()
    ? flat.filter(i => i.label.toLowerCase().includes(query.toLowerCase()))
    : flat

  const execute = useCallback((item) => {
    if (item.action === 'nav') {
      navigate(item.to)
      setOpen(false)
      setQuery('')
    } else {
      setInfo(item.info)
    }
  }, [navigate])

  // Keyboard shortcut to open
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
        setQuery('')
        setSelected(0)
        setInfo(null)
      }
      if (e.key === 'Escape') { setOpen(false); setInfo(null) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Arrow key navigation
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
      if (e.key === 'Enter' && filtered[selected]) { execute(filtered[selected]) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, filtered, selected, execute])

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50) }, [open])
  useEffect(() => { setSelected(0); setInfo(null) }, [query])

  // Group filtered results
  const grouped = commands.map(g => ({
    ...g,
    items: g.items.filter(i => filtered.includes(i)),
  })).filter(g => g.items.length > 0)

  return (
    <>
      {/* Trigger hint in sidebar — small kbd hint */}
      <div
        onClick={() => { setOpen(true); setQuery(''); setSelected(0); setInfo(null) }}
        style={{
          position: 'fixed', bottom: 72, left: 0, width: 220,
          padding: '8px 14px',
          display: 'flex', alignItems: 'center', gap: 8,
          cursor: 'pointer', zIndex: 99,
          borderTop: '1px solid #1a1a1a',
          background: '#111111',
        }}
      >
        <Command size={12} color="#444" />
        <span style={{ fontSize: 11, color: '#444', flex: 1 }}>Command palette</span>
        <kbd style={{
          fontSize: 10, color: '#333', background: '#1a1a1a',
          border: '1px solid #2a2a2a', borderRadius: 3,
          padding: '1px 5px', fontFamily: 'monospace',
        }}>⌘K</kbd>
      </div>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => { setOpen(false); setInfo(null) }}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(3px)',
                zIndex: 1000,
              }}
            />

            {/* Palette */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                top: '18%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 560,
                background: '#111111',
                border: '1px solid #2a2a2a',
                borderRadius: 10,
                boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
                zIndex: 1001,
                overflow: 'hidden',
              }}
            >
              {/* Search input */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px',
                borderBottom: '1px solid #1f1f1f',
              }}>
                <Search size={15} color="#555" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search commands, pages, attack types..."
                  style={{
                    flex: 1, background: 'none', border: 'none', outline: 'none',
                    color: '#e2e2e2', fontSize: 14, fontFamily: 'Inter, sans-serif',
                  }}
                />
                <kbd style={{
                  fontSize: 10, color: '#333', background: '#1a1a1a',
                  border: '1px solid #2a2a2a', borderRadius: 3,
                  padding: '2px 6px', fontFamily: 'monospace',
                }}>ESC</kbd>
              </div>

              {/* Info panel */}
              <AnimatePresence>
                {info && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{
                      padding: '10px 16px',
                      background: '#0d0d0d',
                      borderBottom: '1px solid #1f1f1f',
                      fontSize: 12, color: '#888', lineHeight: 1.6,
                    }}
                  >
                    <span style={{ color: '#3b82f6', marginRight: 6 }}>ℹ</span>{info}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Results */}
              <div style={{ maxHeight: 340, overflowY: 'auto', padding: '6px 0' }}>
                {grouped.length === 0 ? (
                  <div style={{ padding: '20px 16px', color: '#444', fontSize: 13, textAlign: 'center' }}>
                    No results for "{query}"
                  </div>
                ) : grouped.map(group => (
                  <div key={group.group}>
                    <div style={{ padding: '6px 16px 4px', fontSize: 10, color: '#333', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {group.group}
                    </div>
                    {group.items.map(item => {
                      const isSelected = filtered.indexOf(item) === selected
                      return (
                        <div
                          key={item.id}
                          onClick={() => execute(item)}
                          onMouseEnter={() => setSelected(filtered.indexOf(item))}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '8px 16px', cursor: 'pointer',
                            background: isSelected ? '#1a1a1a' : 'transparent',
                            transition: 'background 0.1s',
                          }}
                        >
                          <item.icon size={14} color={isSelected ? '#3b82f6' : '#444'} />
                          <span style={{ flex: 1, fontSize: 13, color: isSelected ? '#e2e2e2' : '#888' }}>
                            {item.label}
                          </span>
                          {isSelected && <ArrowRight size={12} color="#333" />}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div style={{
                display: 'flex', gap: 16, padding: '8px 16px',
                borderTop: '1px solid #1a1a1a',
              }}>
                {[['↵', 'select'], ['↑↓', 'navigate'], ['esc', 'close']].map(([k, l]) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <kbd style={{ fontSize: 10, color: '#333', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 3, padding: '1px 5px', fontFamily: 'monospace' }}>{k}</kbd>
                    <span style={{ fontSize: 10, color: '#333' }}>{l}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sun, Moon, Bell, Shield, Database,
  Monitor, ChevronRight, Check, RefreshCw
} from 'lucide-react'
import Header from '../components/Header'
import { CATEGORY_COLORS } from '../lib/colors'
import { useReady } from '../lib/readyContext'

const fadeUp = (delay = 0, ready = true) => ({
  initial: { opacity: 0, y: 14 },
  animate: ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
  transition: { duration: 0.35, delay, ease: 'easeOut' },
})

// ── Toggle switch ─────────────────────────────────────────────
function Toggle({ value, onChange, color = '#3b82f6' }) {
  return (
    <motion.div
      onClick={() => onChange(!value)}
      style={{
        width: 42, height: 24, borderRadius: 12,
        background: value ? color : '#2a2a2a',
        cursor: 'pointer', position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
        border: `1px solid ${value ? color : '#333'}`,
      }}
    >
      <motion.div
        animate={{ x: value ? 18 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          position: 'absolute', top: 2,
          width: 18, height: 18, borderRadius: '50%',
          background: value ? '#fff' : '#555',
        }}
      />
    </motion.div>
  )
}

// ── Select dropdown ───────────────────────────────────────────
function Select({ value, options, onChange }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        background: '#1a1a1a', border: '1px solid #2a2a2a',
        borderRadius: 7, color: '#ccc', fontSize: 12,
        padding: '6px 10px', cursor: 'pointer', outline: 'none',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

// ── Setting row ───────────────────────────────────────────────
function SettingRow({ label, desc, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 0', borderBottom: '1px solid #1a1a1a',
    }}>
      <div style={{ flex: 1, paddingRight: 24 }}>
        <div style={{ fontSize: 13, color: '#ccc', fontWeight: 500 }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{desc}</div>}
      </div>
      {children}
    </div>
  )
}

// ── Section card ──────────────────────────────────────────────
function Section({ title, icon: Icon, color, children, delay, ready }) {
  return (
    <motion.div {...fadeUp(delay, ready)} style={{
      background: '#161616', border: '1px solid #1f1f1f',
      borderRadius: 10, padding: '18px 20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: `${color}12`, border: `1px solid ${color}25`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={15} color={color} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e2e2' }}>{title}</span>
      </div>
      <div style={{ paddingTop: 4 }}>
        {children}
      </div>
    </motion.div>
  )
}

// ── Saved toast ───────────────────────────────────────────────
function SavedToast({ show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            background: '#1a1a1a', border: '1px solid #2a2a2a',
            borderRadius: 8, padding: '10px 20px',
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 13, color: '#ccc', zIndex: 500,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          }}
        >
          <Check size={14} color={CATEGORY_COLORS.Normal} />
          Settings saved
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Main component ────────────────────────────────────────────
export default function SettingsPage() {
  const ready = useReady()
  useEffect(() => { document.title = 'NIDS · Settings' }, [])

  // State
  const [theme,        setTheme]        = useState('dark')
  const [notifications, setNotif]       = useState(true)
  const [alertSound,   setAlertSound]   = useState(false)
  const [autoRefresh,  setAutoRefresh]  = useState(true)
  const [refreshRate,  setRefreshRate]  = useState('30')
  const [feedVisible,  setFeedVisible]  = useState(true)
  const [highOnly,     setHighOnly]     = useState(false)
  const [apiEndpoint,  setApiEndpoint]  = useState('http://localhost:8000')
  const [saved, setSaved]               = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    setTheme('dark'); setNotif(true); setAlertSound(false)
    setAutoRefresh(true); setRefreshRate('30')
    setFeedVisible(true); setHighOnly(false)
    setApiEndpoint('http://localhost:8000')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <Header title="Settings" subtitle="Customize your dashboard preferences" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Appearance */}
        <Section title="Appearance" icon={Monitor} color="#3b82f6" delay={0.1} ready={ready}>
          <SettingRow label="Theme" desc="Choose your preferred color scheme">
            <div style={{ display: 'flex', gap: 8 }}>
              {['dark', 'light'].map(t => (
                <motion.button
                  key={t}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setTheme(t)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px', borderRadius: 7,
                    background: theme === t ? 'rgba(59,130,246,0.1)' : 'transparent',
                    border: `1px solid ${theme === t ? '#3b82f6' : '#2a2a2a'}`,
                    color: theme === t ? '#3b82f6' : '#555',
                    fontSize: 12, cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {t === 'dark' ? <Moon size={12} /> : <Sun size={12} />}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </motion.button>
              ))}
            </div>
          </SettingRow>

          <SettingRow label="Threat Feed" desc="Show the live threat feed terminal panel">
            <Toggle value={feedVisible} onChange={setFeedVisible} color={CATEGORY_COLORS.Probe} />
          </SettingRow>
        </Section>

        {/* Notifications */}
        <Section title="Notifications" icon={Bell} color={CATEGORY_COLORS.DoS} delay={0.18} ready={ready}>
          <SettingRow label="Alert notifications" desc="Show desktop notifications for new threats">
            <Toggle value={notifications} onChange={setNotif} color={CATEGORY_COLORS.DoS} />
          </SettingRow>

          <SettingRow label="Alert sound" desc="Play a sound when a high-severity attack is detected">
            <Toggle value={alertSound} onChange={setAlertSound} color={CATEGORY_COLORS.DoS} />
          </SettingRow>

          <SettingRow label="High severity only" desc="Only notify for DoS and U2R attacks">
            <Toggle value={highOnly} onChange={setHighOnly} color={CATEGORY_COLORS.R2L} />
          </SettingRow>
        </Section>

        {/* Data */}
        <Section title="Data & Refresh" icon={Database} color={CATEGORY_COLORS.Normal} delay={0.26} ready={ready}>
          <SettingRow label="Auto-refresh" desc="Automatically refresh dashboard data">
            <Toggle value={autoRefresh} onChange={setAutoRefresh} color={CATEGORY_COLORS.Normal} />
          </SettingRow>

          <SettingRow label="Refresh interval" desc="How often to fetch new data from the backend">
            <Select
              value={refreshRate}
              onChange={setRefreshRate}
              options={[
                { value: '10',  label: 'Every 10 seconds' },
                { value: '30',  label: 'Every 30 seconds' },
                { value: '60',  label: 'Every minute' },
                { value: '300', label: 'Every 5 minutes' },
              ]}
            />
          </SettingRow>
        </Section>

        {/* API */}
        <Section title="Backend API" icon={Shield} color={CATEGORY_COLORS.U2R} delay={0.34} ready={ready}>
          <SettingRow label="API endpoint" desc="FastAPI server URL for predictions and stats">
            <input
              value={apiEndpoint}
              onChange={e => setApiEndpoint(e.target.value)}
              style={{
                background: '#1a1a1a', border: '1px solid #2a2a2a',
                borderRadius: 7, color: '#ccc', fontSize: 12,
                padding: '6px 12px', outline: 'none',
                fontFamily: 'monospace', width: 220,
              }}
            />
          </SettingRow>

          <SettingRow label="Connection status" desc="Current backend connection state">
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444' }}
              />
              <span style={{ fontSize: 12, color: '#ef4444' }}>Disconnected</span>
            </div>
          </SettingRow>
        </Section>

        {/* Action buttons */}
        <motion.div {...fadeUp(0.42, ready)} style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <motion.button
            whileHover={{ borderColor: '#555', color: '#888' }}
            whileTap={{ scale: 0.96 }}
            onClick={handleReset}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'transparent', border: '1px solid #2a2a2a',
              borderRadius: 7, padding: '9px 20px',
              color: '#555', fontSize: 13, cursor: 'pointer',
              transition: 'all 0.15s', fontFamily: 'Inter, sans-serif',
            }}
          >
            <RefreshCw size={13} /> Reset to defaults
          </motion.button>

          <motion.button
            whileHover={{ background: '#2563eb' }}
            whileTap={{ scale: 0.96 }}
            onClick={handleSave}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#3b82f6', border: 'none',
              borderRadius: 7, padding: '9px 24px',
              color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', transition: 'background 0.15s',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <Check size={13} /> Save settings
          </motion.button>
        </motion.div>

      </div>

      <SavedToast show={saved} />
    </div>
  )
}

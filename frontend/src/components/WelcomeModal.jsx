import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, Activity, Brain, Terminal, ArrowRight } from 'lucide-react'
import { CATEGORY_COLORS } from '../lib/colors'
import { getModelInfo } from '../lib/api'

// Static fallbacks — shown until /model-info responds
const DEFAULTS = {
  samples:      '125,973',
  features:     '40',
  accuracy:     '99.92',
  testAccuracy: '80.22',
}

export default function WelcomeModal({ onClose }) {
  const [stats, setStats] = useState(DEFAULTS)

  // Fetch real numbers in background — non-blocking
  useEffect(() => {
    getModelInfo()
      .then(res => {
        const d = res.data
        setStats({
          samples:      d.samples?.toLocaleString()                        ?? DEFAULTS.samples,
          features:     String(d.features)                                  ?? DEFAULTS.features,
          accuracy:     d.val_accuracy  != null ? (d.val_accuracy  * 100).toFixed(2) : DEFAULTS.accuracy,
          testAccuracy: d.test_accuracy != null ? (d.test_accuracy * 100).toFixed(2) : DEFAULTS.testAccuracy,
        })
      })
      .catch(() => {}) // keep defaults if backend offline
  }, [])

  const features = [
    {
      icon: Activity, color: CATEGORY_COLORS.Normal,
      label: 'Live Traffic Monitoring',
      desc: `Real-time network flow analysis across ${stats.samples}+ connections`,
    },
    {
      icon: ShieldCheck, color: CATEGORY_COLORS.Probe,
      label: 'Multi-class Detection',
      desc: 'Classifies DoS, Probe, R2L, U2R and Normal traffic',
    },
    {
      icon: Brain, color: '#3b82f6',
      label: 'XGBoost ML Model',
      desc: `${stats.accuracy}% val accuracy · ${stats.testAccuracy}% test · ${stats.features} features`,
    },
    {
      icon: Terminal, color: CATEGORY_COLORS.R2L,
      label: 'Live Threat Feed',
      desc: 'Terminal-style stream of detected intrusion events',
    },
  ]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 24 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: '#111111', border: '1px solid #2a2a2a',
            borderRadius: 14, width: '100%', maxWidth: 540,
            overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.9)',
          }}
        >
          {/* Top accent bar */}
          <motion.div
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            style={{
              height: 2,
              background: `linear-gradient(90deg, #3b82f6, ${CATEGORY_COLORS.Normal}, ${CATEGORY_COLORS.DoS})`,
              transformOrigin: 'left',
            }}
          />

          <div style={{ padding: '32px 36px 28px' }}>

            {/* Logo + title */}
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ShieldCheck size={20} color="#3b82f6" />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#f0f0f0', letterSpacing: '-0.3px' }}>
                  NIDS Dashboard
                </div>
                <div style={{ fontSize: 11, color: '#555' }}>Network Intrusion Detection System</div>
              </div>
            </motion.div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              style={{ fontSize: 13, color: '#666', lineHeight: 1.7, marginBottom: 28 }}
            >
              A machine learning powered security dashboard that detects and classifies
              network intrusions in real time — built on the{' '}
              <span style={{ color: '#888' }}>NSL-KDD</span> dataset using XGBoost
              with SMOTE-balanced training across 5 attack categories.
            </motion.p>

            {/* Feature grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
              {features.map(({ icon: Icon, color, label, desc }, i) => (
                <motion.div key={label}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.07 }}
                  style={{ background: '#161616', border: '1px solid #1f1f1f', borderRadius: 8, padding: '12px 14px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <Icon size={13} color={color} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#ccc' }}>{label}</span>
                  </div>
                  <p style={{ fontSize: 11, color: '#444', lineHeight: 1.5, margin: 0 }}>{desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Tip */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.58 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#0f1620', border: '1px solid #1e2d45',
                borderRadius: 7, padding: '8px 12px', marginBottom: 24,
              }}
            >
              <span style={{ fontSize: 11, color: '#555' }}>
                💡 Press{' '}
                <kbd style={{ fontSize: 10, color: '#888', background: '#1a2332', border: '1px solid #2a3a4a', borderRadius: 3, padding: '1px 5px', fontFamily: 'monospace' }}>
                  Ctrl K
                </kbd>
                {' '}anywhere to open the command palette for quick navigation.
              </span>
            </motion.div>

            {/* CTA */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}>
              <motion.button
                whileHover={{ background: '#1d4ed8' }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: '#3b82f6', color: '#fff', border: 'none',
                  borderRadius: 8, padding: '12px 0',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  transition: 'background 0.2s', fontFamily: 'Inter, sans-serif',
                }}
              >
                Enter Dashboard
                <ArrowRight size={16} />
              </motion.button>
            </motion.div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

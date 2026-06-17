import { motion, AnimatePresence } from 'framer-motion'
import { CATEGORY_COLORS } from '../lib/colors'
import { Terminal, WifiOff } from 'lucide-react'
import { useReady } from '../lib/readyContext'
import { useMockMode } from '../lib/mockModeContext'
import UIverseToggle from './UIverseToggle'

export default function Header({ title, subtitle, onFeedToggle, feedOpen }) {
  const ready = useReady()
  const { mockMode, setMockMode } = useMockMode()

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={{ marginBottom: 24 }}
    >
      {/* Mock mode banner */}
      <AnimatePresence>
        {mockMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden', marginBottom: 14 }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(239,159,39,0.06)',
              border: '1px solid rgba(239,159,39,0.2)',
              borderRadius: 8, padding: '9px 14px',
            }}>
              <WifiOff size={13} color="#EF9F27" />
              <span style={{ fontSize: 12, color: '#EF9F27', flex: 1 }}>
                Running in <strong>Demo mode</strong> — charts and alerts use mock data.
                Connect the FastAPI backend and switch to <strong>API mode</strong> for live predictions.
              </span>
              {/* UIverse toggle — Demo / API */}
              <UIverseToggle
                checked={!mockMode}
                onChange={(val) => setMockMode(!val)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -12 }}
            animate={ready ? { opacity: 1, x: 0 } : { opacity: 0, x: -12 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            style={{ fontSize: 20, fontWeight: 600, color: '#f0f0f0', margin: 0 }}
          >
            {title}
          </motion.h1>
          {subtitle && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={ready ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              style={{ fontSize: 12, color: '#555', marginTop: 2 }}
            >
              {subtitle}
            </motion.p>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={ready ? { opacity: 1, x: 0 } : { opacity: 0, x: 10 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{ display: 'flex', alignItems: 'center', gap: 10 }}
        >
          {/* Mock mode toggle in header when NOT in demo mode */}
          {!mockMode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <UIverseToggle
                checked={!mockMode}
                onChange={(val) => setMockMode(!val)}
              />
              <span style={{ fontSize: 11, color: '#3b82f6' }}>API</span>
            </div>
          )}

          {/* Threat feed toggle */}
          {onFeedToggle && (
            <motion.button
              whileHover={{ borderColor: '#3b82f6', color: '#ccc' }}
              onClick={onFeedToggle}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: feedOpen ? 'rgba(59,130,246,0.08)' : 'transparent',
                border: `1px solid ${feedOpen ? '#3b82f6' : '#2a2a2a'}`,
                borderRadius: 6, padding: '5px 11px',
                color: feedOpen ? '#3b82f6' : '#555',
                fontSize: 12, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <Terminal size={12} />
              Threat Feed
            </motion.button>
          )}

          {/* Live indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <motion.span
              animate={{ opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: 6, height: 6, borderRadius: '50%',
                background: mockMode ? '#EF9F27' : CATEGORY_COLORS.Normal,
                display: 'inline-block',
                boxShadow: `0 0 6px ${mockMode ? '#EF9F27' : CATEGORY_COLORS.Normal}`,
              }}
            />
            <span style={{ fontSize: 12, color: '#555' }}>
              {mockMode ? 'Demo' : 'Live'}
            </span>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ scaleX: 0 }}
        animate={ready ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
        style={{ height: 1, background: '#1a1a1a', marginTop: 16, transformOrigin: 'left' }}
      />
    </motion.div>
  )
}

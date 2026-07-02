import { motion } from 'framer-motion'
import { CATEGORY_COLORS } from '../lib/colors'
import { Terminal } from 'lucide-react'
import { useReady } from '../lib/readyContext'
import { useModel } from '../lib/modelContext'

/**
 * Header — page title + subtitle + dataset toggle (NSL-KDD ↔ CICIDS2017) + threat feed + live dot.
 * Demo/API toggle has been moved to Settings → Backend API.
 */
export default function Header({ title, subtitle, onFeedToggle, feedOpen }) {
  const ready = useReady()
  const { activeModel, setActiveModel } = useModel()

  const kddColor   = '#3b82f6'
  const cicidsColor= '#a78bfa'
  const liveColor  = CATEGORY_COLORS.Normal

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={{ marginBottom: 24 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Left — title + subtitle */}
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

        {/* Right — dataset toggle + threat feed + live dot */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={ready ? { opacity: 1, x: 0 } : { opacity: 0, x: 10 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{ display: 'flex', alignItems: 'center', gap: 10 }}
        >
          {/* ── Dataset toggle: NSL-KDD ↔ CICIDS2017 ── */}
          <div style={{
            display: 'flex', alignItems: 'center',
            background: '#111', border: '1px solid #2a2a2a',
            borderRadius: 8, padding: '3px',
            gap: 2,
          }}>
            {[
              { id: 'kdd',    label: 'NSL-KDD',   color: kddColor    },
              { id: 'cicids', label: 'CICIDS2017', color: cicidsColor },
            ].map(opt => {
              const isActive = activeModel === opt.id
              return (
                <motion.button
                  key={opt.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setActiveModel(opt.id)}
                  style={{
                    padding: '4px 12px', borderRadius: 5,
                    border: 'none', cursor: 'pointer',
                    fontSize: 11, fontWeight: isActive ? 600 : 400,
                    background: isActive ? `${opt.color}18` : 'transparent',
                    color: isActive ? opt.color : '#555',
                    transition: 'all 0.15s',
                    outline: isActive ? `1px solid ${opt.color}30` : 'none',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {opt.label}
                </motion.button>
              )
            })}
          </div>

          {/* Threat Feed toggle — only on Dashboard */}
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
                background: liveColor,
                display: 'inline-block',
                boxShadow: `0 0 6px ${liveColor}`,
              }}
            />
            <span style={{ fontSize: 12, color: '#555' }}>Live</span>
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

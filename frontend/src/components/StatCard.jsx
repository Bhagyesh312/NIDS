import { motion } from 'framer-motion'

export default function StatCard({ label, value, color, icon: Icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        background: '#111827',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: '20px 24px',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span style={{ color: '#888888', fontSize: 13 }}>{label}</span>
        {Icon && <Icon size={16} color={color || '#888888'} />}
      </div>
      <div style={{
        fontSize: 32,
        fontWeight: 700,
        color: color || '#F1F1EE',
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.5px',
      }}>
        {value}
      </div>
    </motion.div>
  )
}

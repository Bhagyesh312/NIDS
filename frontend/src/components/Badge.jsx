import { CATEGORY_COLORS, CATEGORY_BG } from '../lib/colors'

export default function Badge({ label }) {
  const color = CATEGORY_COLORS[label] || '#888'
  const bg    = CATEGORY_BG[label]    || '#1a1a1a'
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 600,
      color,
      background: bg,
      border: `1px solid ${color}22`,
    }}>
      {label}
    </span>
  )
}

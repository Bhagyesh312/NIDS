import { motion } from 'framer-motion'

const shimmer = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'linear',
  },
}

function SkeletonBox({ width = '100%', height = 14, radius = 4, style = {} }) {
  return (
    <motion.div
      {...shimmer}
      style={{
        width,
        height,
        borderRadius: radius,
        background: 'linear-gradient(90deg, #1a1a1a 25%, #242424 50%, #1a1a1a 75%)',
        backgroundSize: '400% 100%',
        ...style,
      }}
    />
  )
}

export function SkeletonStatCard() {
  return (
    <div style={{
      background: '#161616', border: '1px solid #1f1f1f',
      borderRadius: 8, padding: '16px 18px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <SkeletonBox width={90} height={12} />
        <SkeletonBox width={16} height={16} radius={4} />
      </div>
      <SkeletonBox width={80} height={28} radius={4} style={{ marginBottom: 10 }} />
      <SkeletonBox width={60} height={10} />
    </div>
  )
}

export function SkeletonTableRow() {
  return (
    <tr style={{ borderTop: '1px solid #1a1a1a' }}>
      {[70, 130, 130, 60, 55].map((w, i) => (
        <td key={i} style={{ padding: '11px 0', paddingRight: 12 }}>
          <SkeletonBox width={w} height={12} radius={4} />
        </td>
      ))}
    </tr>
  )
}

export function SkeletonCard({ height = 200 }) {
  return (
    <div style={{
      background: '#161616', border: '1px solid #1f1f1f',
      borderRadius: 8, padding: '18px 20px', height,
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <SkeletonBox width={120} height={13} />
      <SkeletonBox width="100%" height={height - 80} radius={6} style={{ flex: 1 }} />
      <SkeletonBox width={80} height={11} />
    </div>
  )
}

export default SkeletonBox

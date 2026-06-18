import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck, LayoutDashboard, Bell, Upload, FileText, Settings, BookOpen } from 'lucide-react'
import { CATEGORY_COLORS } from '../lib/colors'
import { useReady } from '../lib/readyContext'
import { useAlertCount } from '../lib/alertsStore'
import { useMockMode } from '../lib/mockModeContext'

const NAV_LINKS = [
  { to: '/info',     label: 'Info',       icon: BookOpen },
  { to: '/',         label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/alerts',   label: 'Alerts',     icon: Bell, showBadge: true },
  { to: '/batch',    label: 'Upload CSV', icon: Upload },
  { to: '/reports',  label: 'Reports',    icon: FileText },
  { to: '/settings', label: 'Settings',   icon: Settings },
]

export default function Sidebar() {
  const ready            = useReady()
  const { mockMode }     = useMockMode()
  const liveAlertCount   = useAlertCount()
  // In demo mode show a fixed placeholder badge; in API mode show the real count
  const alertBadge = mockMode ? 3 : liveAlertCount
  return (
    <motion.aside
      initial={{ x: -220 }}
      animate={ready ? { x: 0 } : { x: -220 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={{
        width: 220, minWidth: 220, height: '100vh',
        background: '#111111',
        borderRight: '1px solid #1f1f1f',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, zIndex: 50,
      }}
    >
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: 1 } : { opacity: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          display: 'flex', alignItems: 'center', gap: 9,
          padding: '20px 16px 16px',
          borderBottom: '1px solid #1a1a1a',
        }}
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 3 }}
        >
          <ShieldCheck size={18} color="#3b82f6" />
        </motion.div>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#f0f0f0' }}>NIDS</span>
      </motion.div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 8px' }}>
        {NAV_LINKS.map(({ to, label, icon: Icon, showBadge }, i) => (
          <motion.div
            key={to}
            initial={{ opacity: 0, x: -16 }}
            animate={ready ? { opacity: 1, x: 0 } : { opacity: 0, x: -16 }}
            transition={{ delay: 0.15 + i * 0.06, duration: 0.3 }}
          >
            <NavLink to={to} end={to === '/' || to === '/info'}>
              {({ isActive }) => (
                <motion.div
                  whileHover={{ x: 3 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '8px 10px', borderRadius: 6,
                    fontSize: 13, fontWeight: isActive ? 500 : 400,
                    color: isActive ? '#f0f0f0' : '#555',
                    background: isActive ? '#1a1a1a' : 'transparent',
                    marginBottom: 1, cursor: 'pointer',
                    borderLeft: isActive ? `2px solid #3b82f6` : '2px solid transparent',
                    paddingLeft: isActive ? 8 : 10,
                  }}
                >
                  <Icon size={15} color={isActive ? '#3b82f6' : '#444'} />
                  <span style={{ flex: 1 }}>{label}</span>
                  {showBadge && alertBadge > 0 && (
                    <motion.span
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                      style={{
                        fontSize: 10, fontWeight: 600,
                        background: CATEGORY_COLORS.DoS, color: '#fff',
                        borderRadius: 4, padding: '1px 5px',
                      }}
                    >
                      {alertBadge > 99 ? '99+' : alertBadge}
                    </motion.span>
                  )}
                </motion.div>
              )}
            </NavLink>
          </motion.div>
        ))}
      </nav>

      {/* User */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: 1 } : { opacity: 0 }}
        transition={{ delay: 0.5 }}
        style={{
          padding: '12px 14px',
          borderTop: '1px solid #1a1a1a',
          display: 'flex', alignItems: 'center', gap: 9,
        }}
      >
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: '#222', border: '1px solid #2a2a2a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 600, color: '#888', flexShrink: 0,
        }}>
          BP
        </div>
        <div>
          <div style={{ fontSize: 13, color: '#ccc', fontWeight: 500 }}>Bhagyesh</div>
          <div style={{ fontSize: 11, color: '#444' }}>Admin</div>
        </div>
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          style={{
            marginLeft: 'auto', width: 6, height: 6,
            borderRadius: '50%', background: CATEGORY_COLORS.Normal,
          }}
        />
      </motion.div>
    </motion.aside>
  )
}

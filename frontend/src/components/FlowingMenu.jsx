import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck, LayoutDashboard, Bell, Upload,
  FileText, Settings, BookOpen, Globe, Menu, X, Crosshair
} from 'lucide-react'
import { CATEGORY_COLORS } from '../lib/colors'
import { useReady } from '../lib/readyContext'
import { useAlertCount } from '../lib/alertsStore'

// Stagger variants for cascade wave
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
  exit:   { transition: { staggerChildren: 0.04, staggerDirection: -1 } },
}

const itemVariants = {
  hidden:  { opacity: 0, x: -32, filter: 'blur(8px)' },
  visible: { opacity: 1, x: 0,   filter: 'blur(0px)',
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, x: -20, filter: 'blur(6px)',
    transition: { duration: 0.25, ease: 'easeIn' } },
}

const backdropVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit:    { opacity: 0, transition: { duration: 0.2 } },
}

const panelVariants = {
  hidden:  { x: '-100%', opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit:    { x: '-100%', opacity: 0, transition: { duration: 0.3, ease: 'easeIn' } },
}

export default function FlowingMenu() {
  const [open, setOpen]         = useState(false)
  const [hovered, setHovered]   = useState(null)
  const ready      = useReady()
  const location   = useLocation()
  const alertCount = useAlertCount()

  const links = [
    { to: '/info',     label: 'Info',        icon: BookOpen,        color: '#3b82f6'               },
    { to: '/',         label: 'Dashboard',   icon: LayoutDashboard, color: CATEGORY_COLORS.Normal  },
    { to: '/globe',    label: 'Globe',       icon: Globe,           color: CATEGORY_COLORS.Probe   },
    { to: '/alerts',   label: 'Alerts',      icon: Bell,            color: CATEGORY_COLORS.DoS, badge: alertCount },
    { to: '/predict',  label: 'Predict',     icon: Crosshair,       color: CATEGORY_COLORS.U2R     },
    { to: '/batch',    label: 'Upload CSV',  icon: Upload,          color: CATEGORY_COLORS.R2L     },
    { to: '/reports',  label: 'Reports',     icon: FileText,        color: '#3b82f6'               },
    { to: '/settings', label: 'Settings',    icon: Settings,        color: '#666'                  },
  ]

  // Close on route change
  useEffect(() => { setOpen(false) }, [location.pathname])

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Fixed sidebar strip — just logo + hamburger */}
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
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 16px 16px',
          borderBottom: '1px solid #1a1a1a',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 3 }}
            >
              <ShieldCheck size={18} color="#3b82f6" />
            </motion.div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#f0f0f0' }}>NIDS</span>
          </div>

          {/* Hamburger */}
          <motion.button
            whileHover={{ background: '#1a1a1a' }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setOpen(o => !o)}
            style={{
              background: 'none', border: '1px solid #2a2a2a',
              borderRadius: 6, padding: '5px 7px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#666',
            }}
          >
            <AnimatePresence mode="wait">
              {open
                ? <motion.span key="x"   initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}><X    size={15} /></motion.span>
                : <motion.span key="ham" initial={{ rotate:  90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }}><Menu size={15} /></motion.span>
              }
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Normal nav — all links always visible */}
        {!open && (
          <nav style={{ flex: 1, padding: '8px 8px' }}>
            {links.map(({ to, label, icon: Icon, color, badge }) => {
              const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
              return (
                <NavLink key={to} to={to} end={to === '/' || to === '/info' || to === '/globe' || to === '/predict'}
                  style={{ textDecoration: 'none' }}>
                  <motion.div
                    whileHover={{ x: 2 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 9,
                      padding: '8px 10px', borderRadius: 6,
                      fontSize: 13, fontWeight: isActive ? 500 : 400,
                      color: isActive ? '#f0f0f0' : '#555',
                      background: isActive ? '#1a1a1a' : 'transparent',
                      marginBottom: 1, cursor: 'pointer',
                      borderLeft: isActive ? `2px solid ${color}` : '2px solid transparent',
                      paddingLeft: isActive ? 8 : 10,
                    }}
                  >
                    <Icon size={15} color={isActive ? color : '#444'} />
                    <span style={{ flex: 1 }}>{label}</span>
                    {badge && (
                      <span style={{
                        fontSize: 10, fontWeight: 600,
                        background: '#ef4444', color: '#fff',
                        borderRadius: 4, padding: '1px 5px',
                      }}>{badge}</span>
                    )}
                  </motion.div>
                </NavLink>
              )
            })}
          </nav>
        )}

        {/* User chip */}
        <motion.div
          initial={{ opacity: 0 }} animate={ready ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            padding: '12px 14px', borderTop: '1px solid #1a1a1a',
            display: 'flex', alignItems: 'center', gap: 9,
          }}
        >
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: '#222', border: '1px solid #2a2a2a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 600, color: '#888', flexShrink: 0,
          }}>BP</div>
          <div>
            <div style={{ fontSize: 13, color: '#ccc', fontWeight: 500 }}>Bhagyesh</div>
            <div style={{ fontSize: 11, color: '#444' }}>Admin</div>
          </div>
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: CATEGORY_COLORS.Normal }}
          />
        </motion.div>
      </motion.aside>

      {/* ── Flowing overlay menu ──────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              variants={backdropVariants}
              initial="hidden" animate="visible" exit="exit"
              onClick={() => setOpen(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 200,
                background: 'rgba(0,0,0,0.75)',
                backdropFilter: 'blur(4px)',
              }}
            />

            {/* Sliding panel */}
            <motion.div
              variants={panelVariants}
              initial="hidden" animate="visible" exit="exit"
              style={{
                position: 'fixed', top: 0, left: 0,
                width: 320, height: '100vh',
                background: '#0d0d0d',
                borderRight: '1px solid #1f1f1f',
                zIndex: 201,
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Panel header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '20px 24px 18px',
                borderBottom: '1px solid #1a1a1a',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ShieldCheck size={20} color="#3b82f6" />
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f0' }}>NIDS</span>
                </div>
                <motion.button
                  whileHover={{ background: '#1a1a1a', rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setOpen(false)}
                  style={{
                    background: 'none', border: '1px solid #2a2a2a',
                    borderRadius: 6, padding: '5px 7px', cursor: 'pointer',
                    color: '#666', display: 'flex',
                  }}
                >
                  <X size={16} />
                </motion.button>
              </div>

              {/* Cascading nav links */}
              <motion.nav
                variants={containerVariants}
                initial="hidden" animate="visible" exit="exit"
                style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}
              >
                {links.map(({ to, label, icon: Icon, color, badge }) => {
                  const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
                  return (
                    <motion.div key={to} variants={itemVariants}>
                      <NavLink
                        to={to}
                        end={to === '/' || to === '/info' || to === '/globe' || to === '/predict'}
                        style={{ textDecoration: 'none' }}
                        onMouseEnter={() => setHovered(to)}
                        onMouseLeave={() => setHovered(null)}
                      >
                        <motion.div
                          animate={{
                            background: isActive
                              ? `${color}12`
                              : hovered === to ? '#161616' : 'transparent',
                            borderColor: isActive ? `${color}30` : hovered === to ? '#2a2a2a' : 'transparent',
                          }}
                          transition={{ duration: 0.15 }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 14,
                            padding: '13px 16px', borderRadius: 10,
                            border: '1px solid transparent',
                            cursor: 'pointer', position: 'relative', overflow: 'hidden',
                          }}
                        >
                          {/* Color indicator bar on left */}
                          <motion.div
                            animate={{ opacity: isActive || hovered === to ? 1 : 0, scaleY: isActive || hovered === to ? 1 : 0 }}
                            style={{
                              position: 'absolute', left: 0, top: '20%', bottom: '20%',
                              width: 3, borderRadius: 2,
                              background: color,
                            }}
                          />

                          {/* Icon with glow on active */}
                          <motion.div
                            animate={{ color: isActive ? color : hovered === to ? '#888' : '#444' }}
                            style={{
                              width: 36, height: 36, borderRadius: 9,
                              background: isActive ? `${color}15` : hovered === to ? '#1a1a1a' : '#161616',
                              border: `1px solid ${isActive ? color + '25' : '#1f1f1f'}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0, transition: 'all 0.15s',
                            }}
                          >
                            <Icon size={16} color={isActive ? color : hovered === to ? '#777' : '#444'} />
                          </motion.div>

                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: 14, fontWeight: isActive ? 600 : 400,
                              color: isActive ? '#f0f0f0' : hovered === to ? '#ccc' : '#666',
                              transition: 'color 0.15s',
                            }}>
                              {label}
                            </div>
                          </div>

                          {badge && (
                            <motion.span
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                              style={{
                                fontSize: 10, fontWeight: 700,
                                background: '#ef4444', color: '#fff',
                                borderRadius: 5, padding: '2px 7px',
                              }}
                            >
                              {badge}
                            </motion.span>
                          )}

                          {/* Active dot */}
                          {isActive && (
                            <motion.div
                              layoutId="activeIndicator"
                              style={{ width: 6, height: 6, borderRadius: '50%', background: color }}
                            />
                          )}
                        </motion.div>
                      </NavLink>
                    </motion.div>
                  )
                })}
              </motion.nav>

              {/* Bottom user strip */}
              <div style={{
                padding: '16px 20px', borderTop: '1px solid #1a1a1a',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: '#1a1a1a', border: '1px solid #2a2a2a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: '#888',
                }}>BP</div>
                <div>
                  <div style={{ fontSize: 13, color: '#ccc', fontWeight: 500 }}>Bhagyesh</div>
                  <div style={{ fontSize: 11, color: '#444' }}>Administrator</div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <motion.div
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    style={{ width: 6, height: 6, borderRadius: '50%', background: CATEGORY_COLORS.Normal }}
                  />
                  <span style={{ fontSize: 10, color: '#444' }}>Online</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

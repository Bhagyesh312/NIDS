import { useEffect, useRef, useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Sidebar from './components/Sidebar'
import CommandPalette from './components/CommandPalette'
import ThreatFeed from './components/ThreatFeed'
import WelcomeModal from './components/WelcomeModal'
import Dashboard from './pages/Dashboard'
import Predict from './pages/Predict'
import Batch from './pages/Batch'
import ModelInfo from './pages/ModelInfo'
import { ReadyContext } from './lib/readyContext'

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -4 }}
    transition={{ duration: 0.25, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
)

function AnimatedRoutes({ feedOpen, toggleFeed }) {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/"         element={<PageWrapper><Dashboard feedOpen={feedOpen} onFeedToggle={toggleFeed} /></PageWrapper>} />
        <Route path="/predict"  element={<PageWrapper><Predict /></PageWrapper>} />
        <Route path="/batch"    element={<PageWrapper><Batch /></PageWrapper>} />
        <Route path="/model"    element={<PageWrapper><ModelInfo /></PageWrapper>} />
        <Route path="/alerts"   element={<PageWrapper><div style={{ color: '#555', padding: 40 }}>Alerts — coming soon</div></PageWrapper>} />
        <Route path="/reports"  element={<PageWrapper><div style={{ color: '#555', padding: 40 }}>Reports — coming soon</div></PageWrapper>} />
        <Route path="/settings" element={<PageWrapper><div style={{ color: '#555', padding: 40 }}>Settings — coming soon</div></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  )
}

function Layout() {
  const scrollRef = useRef(null)
  const [feedOpen, setFeedOpen]       = useState(false)
  const [showWelcome, setShowWelcome] = useState(() => !sessionStorage.getItem('welcome-seen'))
  const [ready, setReady]             = useState(() => !!sessionStorage.getItem('welcome-seen'))
  const toggleFeed = () => setFeedOpen(o => !o)

  const handleWelcomeClose = () => {
    sessionStorage.setItem('welcome-seen', '1')
    setShowWelcome(false)
    setReady(true)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/lenis@1.1.13/dist/lenis.min.js'
    script.onload = () => {
      const lenis = new window.Lenis({
        wrapper: scrollRef.current,
        content: scrollRef.current,
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      })
      const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf) }
      requestAnimationFrame(raf)
    }
    document.head.appendChild(script)
  }, [])

  return (
    <ReadyContext.Provider value={ready}>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <AnimatePresence>
          {showWelcome && <WelcomeModal onClose={handleWelcomeClose} />}
        </AnimatePresence>
        <Sidebar />
        <CommandPalette />

        <AnimatePresence>
          {feedOpen && <ThreatFeed open={feedOpen} />}
        </AnimatePresence>

        <div
          ref={scrollRef}
          style={{
            marginLeft: 220,
            flex: 1,
            height: '100vh',
            overflowY: 'auto',
            background: '#0d0d0d',
            padding: '20px 24px',
            marginRight: feedOpen ? 440 : 0,
            transition: 'margin-right 0.3s ease',
          }}
        >
          <AnimatedRoutes feedOpen={feedOpen} toggleFeed={toggleFeed} />
        </div>
      </div>
    </ReadyContext.Provider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}

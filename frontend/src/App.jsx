import { useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import FlowingMenu from './components/FlowingMenu'
import CommandPalette from './components/CommandPalette'
import ThreatFeed from './components/ThreatFeed'
import WelcomeModal from './components/WelcomeModal'
import ErrorBoundary from './components/ErrorBoundary'
import Dashboard from './pages/Dashboard'
import Predict from './pages/Predict'
import Batch from './pages/Batch'
import ModelInfo from './pages/ModelInfo'
import InfoPage from './pages/InfoPage'
import GlobePage from './pages/GlobePage'
import AlertsPage from './pages/AlertsPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'
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
        <Route path="/info"     element={<PageWrapper><InfoPage /></PageWrapper>} />
        <Route path="/predict"  element={<PageWrapper><Predict /></PageWrapper>} />
        <Route path="/batch"    element={<PageWrapper><Batch /></PageWrapper>} />
        <Route path="/model"    element={<PageWrapper><ModelInfo /></PageWrapper>} />
        <Route path="/globe"    element={<PageWrapper><ErrorBoundary fallbackMessage="Globe failed to load. Check your internet connection."><GlobePage /></ErrorBoundary></PageWrapper>} />
        <Route path="/alerts"   element={<PageWrapper><AlertsPage /></PageWrapper>} />
        <Route path="/reports"  element={<PageWrapper><ReportsPage /></PageWrapper>} />
        <Route path="/settings" element={<PageWrapper><SettingsPage /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  )
}

function Layout() {
  const [feedOpen, setFeedOpen]       = useState(false)
  const [showWelcome, setShowWelcome] = useState(() => !sessionStorage.getItem('welcome-seen'))
  const [ready, setReady]             = useState(() => !!sessionStorage.getItem('welcome-seen'))
  const toggleFeed = () => setFeedOpen(o => !o)

  const handleWelcomeClose = () => {
    sessionStorage.setItem('welcome-seen', '1')
    setShowWelcome(false)
    setReady(true)
  }

  return (
    <ReadyContext.Provider value={ready}>
      <div style={{ display: 'flex', height: '100vh' }}>
        <AnimatePresence>
          {showWelcome && <WelcomeModal onClose={handleWelcomeClose} />}
        </AnimatePresence>

        <FlowingMenu />
        <CommandPalette />

        <AnimatePresence>
          {feedOpen && <ThreatFeed open={feedOpen} />}
        </AnimatePresence>

        <main style={{
          marginLeft: 220,
          flex: 1,
          height: '100vh',
          overflowY: 'scroll',
          background: '#0d0d0d',
          padding: '20px 24px 60px',
          marginRight: feedOpen ? 440 : 0,
          transition: 'margin-right 0.3s ease',
          scrollbarWidth: 'thin',
          scrollbarColor: '#1e293b transparent',
        }}>
          <ErrorBoundary>
            <AnimatedRoutes feedOpen={feedOpen} toggleFeed={toggleFeed} />
          </ErrorBoundary>
        </main>
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

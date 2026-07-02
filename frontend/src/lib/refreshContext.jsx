/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'

// Persisted refresh settings — read by Dashboard, AlertsPage, ThreatFeed
const STORAGE_AUTO    = 'nids-auto-refresh'
const STORAGE_RATE    = 'nids-refresh-rate'

const defaults = { autoRefresh: true, refreshRate: '30' }

export const RefreshContext = createContext({
  ...defaults,
  setAutoRefresh: () => {},
  setRefreshRate: () => {},
})

export const useRefreshSettings = () => useContext(RefreshContext)

export function RefreshProvider({ children }) {
  const [autoRefresh, setAutoRefreshState] = useState(
    () => localStorage.getItem(STORAGE_AUTO) !== 'false'  // default true
  )
  const [refreshRate, setRefreshRateState] = useState(
    () => localStorage.getItem(STORAGE_RATE) || '30'
  )

  const setAutoRefresh = (val) => {
    setAutoRefreshState(val)
    localStorage.setItem(STORAGE_AUTO, String(val))
  }

  const setRefreshRate = (val) => {
    setRefreshRateState(val)
    localStorage.setItem(STORAGE_RATE, val)
  }

  return (
    <RefreshContext.Provider value={{ autoRefresh, refreshRate, setAutoRefresh, setRefreshRate }}>
      {children}
    </RefreshContext.Provider>
  )
}

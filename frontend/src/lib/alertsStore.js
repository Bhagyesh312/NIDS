import { useState, useEffect } from 'react'
import { getAlertCount } from './api'

// Fallback count used when backend is offline
const FALLBACK_COUNT = 17
// Poll interval for the sidebar badge (ms)
const BADGE_POLL_MS = 30_000

/**
 * Hook — returns live alert count from backend, refreshed every 30 seconds.
 * Falls back to FALLBACK_COUNT if backend is offline.
 */
export function useAlertCount() {
  const [count, setCount] = useState(FALLBACK_COUNT)

  useEffect(() => {
    let cancelled = false

    const fetch = () => {
      getAlertCount()
        .then(res => {
          if (!cancelled && typeof res.data?.count === 'number') {
            setCount(res.data.count)
          }
        })
        .catch(() => {}) // keep fallback on error
    }

    fetch() // immediate first fetch
    const id = setInterval(fetch, BADGE_POLL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  return count
}

// Static export kept for backward compatibility
export const UNREAD_ALERTS = FALLBACK_COUNT

import { useState, useEffect } from 'react'
import { getAlertCount } from './api'

// Fallback count used when backend is offline
const FALLBACK_COUNT = 17

/**
 * Hook — returns live alert count from backend.
 * Falls back to FALLBACK_COUNT if backend is offline.
 */
export function useAlertCount() {
  const [count, setCount] = useState(FALLBACK_COUNT)

  useEffect(() => {
    getAlertCount()
      .then(res => {
        if (typeof res.data?.count === 'number') {
          setCount(res.data.count)
        }
      })
      .catch(() => {}) // keep fallback
  }, [])

  return count
}

// Static export kept for backward compatibility
export const UNREAD_ALERTS = FALLBACK_COUNT

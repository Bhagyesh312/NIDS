/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'

/**
 * modelContext — tracks which ML model the user has selected.
 * 'kdd'    → NSL-KDD (5 classes: Normal, DoS, Probe, R2L, U2R)
 * 'cicids' → CICIDS2017 (10 classes: Benign, Bot, BruteForce, DDoS, DoS, ...)
 *
 * Persisted to localStorage so refresh keeps the choice.
 * All API calls that need the model read from this context.
 */

export const ModelContext = createContext({
  activeModel:    'kdd',
  setActiveModel: () => {},
})

export const useModel = () => useContext(ModelContext)

export function ModelProvider({ children }) {
  const [activeModel, setActiveModelState] = useState(
    () => localStorage.getItem('nids-active-model') || 'kdd'
  )

  const setActiveModel = (val) => {
    if (val !== 'kdd' && val !== 'cicids') return
    setActiveModelState(val)
    localStorage.setItem('nids-active-model', val)
  }

  return (
    <ModelContext.Provider value={{ activeModel, setActiveModel }}>
      {children}
    </ModelContext.Provider>
  )
}

import { createContext, useContext, useState, useEffect } from 'react'

export const MockModeContext = createContext({ mockMode: true, setMockMode: () => {} })
export const useMockMode = () => useContext(MockModeContext)

export function MockModeProvider({ children }) {
  // Default: mock mode ON (safe — works without backend)
  // Persisted to localStorage so refresh keeps the state
  const [mockMode, setMockMode] = useState(() => {
    const saved = localStorage.getItem('nids-mock-mode')
    return saved === null ? true : saved === 'true'
  })

  useEffect(() => {
    localStorage.setItem('nids-mock-mode', String(mockMode))
  }, [mockMode])

  return (
    <MockModeContext.Provider value={{ mockMode, setMockMode }}>
      {children}
    </MockModeContext.Provider>
  )
}

import { createContext, useContext } from 'react'

// true = modal dismissed, animations can fire
export const ReadyContext = createContext(false)
export const useReady = () => useContext(ReadyContext)

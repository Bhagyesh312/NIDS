import { createContext, useContext, useState, useEffect } from 'react'

export const ThemeContext = createContext({ theme: 'dark', setTheme: () => {} })
export const useTheme = () => useContext(ThemeContext)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() =>
    localStorage.getItem('nids-theme') || 'dark'
  )

  useEffect(() => {
    localStorage.setItem('nids-theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

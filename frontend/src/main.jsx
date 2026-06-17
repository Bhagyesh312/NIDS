import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { ThemeProvider } from './lib/themeContext.jsx'
import { MockModeProvider } from './lib/mockModeContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <MockModeProvider>
        <ErrorBoundary fallbackMessage="Application failed to load. Check the browser console for details.">
          <App />
        </ErrorBoundary>
      </MockModeProvider>
    </ThemeProvider>
  </StrictMode>
)

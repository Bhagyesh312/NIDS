import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { ThemeProvider } from './lib/themeContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <ErrorBoundary fallbackMessage="Application failed to load. Check the browser console for details.">
        <App />
      </ErrorBoundary>
    </ThemeProvider>
  </StrictMode>
)

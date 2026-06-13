import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '60vh', gap: 16,
          color: '#555', textAlign: 'center',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertTriangle size={22} color="#ef4444" />
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#ccc', marginBottom: 6 }}>
              Something went wrong
            </p>
            <p style={{ fontSize: 12, color: '#555', maxWidth: 320 }}>
              {this.props.fallbackMessage || this.state.error?.message || 'An unexpected error occurred in this section.'}
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              background: 'transparent', border: '1px solid #2a2a2a',
              borderRadius: 6, color: '#888', fontSize: 12,
              padding: '7px 16px', cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

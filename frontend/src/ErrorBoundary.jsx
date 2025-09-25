import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('UI ErrorBoundary:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, color: '#e2e8f0', background: '#0f172a', minHeight: '100vh' }}>
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>Ocorreu um erro no frontend</h1>
          <pre style={{ whiteSpace: 'pre-wrap', opacity: 0.8 }}>{String(this.state.error)}</pre>
          <p style={{ marginTop: 16, opacity: 0.8 }}>Confira o console do navegador para mais detalhes (F12 → Console).</p>
        </div>
      )
    }
    return this.props.children
  }
}

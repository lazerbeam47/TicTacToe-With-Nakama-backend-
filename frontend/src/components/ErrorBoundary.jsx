// components/ErrorBoundary.jsx
import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
          <div className="panel p-8 max-w-sm w-full">
            <div className="text-5xl mb-4">💥</div>
            <h2 className="font-display text-3xl text-coral mb-2">Something crashed</h2>
            <p className="text-muted text-sm font-mono mb-6">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="btn-primary w-full"
            >
              ← Back to Lobby
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

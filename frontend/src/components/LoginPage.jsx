// components/LoginPage.jsx
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useStore } from '@/lib/store'
import { Navigate } from 'react-router-dom'

export default function LoginPage() {
  const { login, loading, error } = useAuth()
  const session = useStore(s => s.session)
  const [username, setUsername] = useState('')

  if (session) return <Navigate to="/" replace />

  const handleSubmit = (e) => {
    e.preventDefault()
    login(username)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(#00FFB2 1px, transparent 1px), linear-gradient(90deg, #00FFB2 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, #00FFB210 0%, transparent 70%)' }}
      />

      <div className="relative z-10 w-full max-w-sm animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="text-neon font-display text-6xl glow-neon tracking-widest">LILA</span>
          </div>
          <p className="text-muted font-mono text-xs tracking-[0.3em] uppercase">
            Multiplayer Tic-Tac-Toe
          </p>
        </div>

        {/* Card */}
        <div className="panel p-8">
          <h2 className="font-display text-2xl tracking-wider text-white mb-1">Enter the arena</h2>
          <p className="text-muted text-sm mb-6">Choose your display name to get started</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-muted mb-2 tracking-widest uppercase">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="e.g. NeonShark42"
                maxLength={20}
                className="w-full bg-dim border border-border rounded-xl px-4 py-3
                           text-white font-mono placeholder-muted/50
                           focus:outline-none focus:border-neon/60 focus:ring-1 focus:ring-neon/30
                           transition-all duration-200"
                autoFocus
              />
            </div>

            {error && (
              <div className="text-coral text-sm font-mono bg-coral/10 border border-coral/20 rounded-lg px-3 py-2">
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner /> Connecting…
                </span>
              ) : 'Play Now →'}
            </button>
          </form>

          <p className="text-muted text-xs text-center mt-4 font-mono">
            Your device ID is saved locally. No password needed.
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-muted/50 text-xs font-mono mt-6">
          Powered by Nakama · Built for LILA
        </p>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
    </svg>
  )
}

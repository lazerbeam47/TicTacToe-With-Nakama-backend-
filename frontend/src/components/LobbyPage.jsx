import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/lib/store'
import { rpc, joinMatch } from '@/lib/nakama'
import { useAuth } from '@/hooks/useAuth'

const TOOLTIPS = {
  quick: {
    title: '⚡ Quick Play',
    body: 'Automatically matches you with another player who is also looking for a game. No setup needed — just click and wait. If no one is available, a room is created and the next player who clicks Quick Play will join you automatically.',
  },
  private: {
    title: '🔒 Create Private Match',
    body: 'Creates a private room just for you and a friend. No auto-matching — once the room is created, a Match ID is copied to your clipboard. Share that ID with your friend and ask them to paste it in the "Join by Match ID" field.',
  },
  join: {
    title: '🔗 Join by Match ID',
    body: 'Enter a Match ID shared by a friend who created a Private Match. Paste the ID in the box and click Join to enter their room directly.',
  },
  timed: {
    title: '⏱ Timed Mode',
    body: 'Coming Soon! Each player will have 30 seconds per turn. Run out of time and you auto-forfeit. Stay tuned for this feature.',
    comingSoon: true,
  },
}

function InfoModal({ id, onClose }) {
  const tip = TOOLTIPS[id]
  if (!tip) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={onClose}>
      <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" />
      <div className="relative panel p-6 max-w-sm w-full animate-pop"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-3">
          <h3 className={`font-display text-2xl tracking-wider ${tip.comingSoon ? 'text-muted' : 'text-neon'}`}>
            {tip.title}
          </h3>
          <button onClick={onClose} className="text-muted hover:text-white text-xl leading-none ml-4">✕</button>
        </div>
        {tip.comingSoon && (
          <span className="inline-block text-xs font-mono bg-gold/20 text-gold border border-gold/30 px-2 py-0.5 rounded-full mb-3">
            🚧 Coming Soon
          </span>
        )}
        <p className="text-muted text-sm leading-relaxed">{tip.body}</p>
        <button onClick={onClose} className="btn-ghost w-full mt-5 text-center">Got it</button>
      </div>
    </div>
  )
}

function InfoButton({ id, onClick }) {
  return (
    <button
      onClick={() => onClick(id)}
      className="w-6 h-6 rounded-full bg-neon/20 border border-neon/60 text-neon text-xs font-bold
                 flex items-center justify-center hover:bg-neon hover:text-ink transition-all flex-shrink-0
                 shadow-[0_0_8px_rgba(0,255,178,0.4)]"
      title="What is this?"
    >
      i
    </button>
  )
}

export default function LobbyPage() {
  const navigate   = useNavigate()
  const { logout } = useAuth()
  const { username, setMatch, setTimedMode, addNotification, resetMatch, setWaiting } = useStore()

  const [mode,    setMode]    = useState('classic')
  const [joinId,  setJoinId]  = useState('')
  const [loading, setLoading] = useState(null)
  const [tooltip, setTooltip] = useState(null)

  async function handleQuickPlay() {
    if (mode === 'timed') { setTooltip('timed'); return }
    setLoading('quick')
    try {
      const { match_id } = await rpc('find_or_create_match', { timed: false })
      resetMatch()
      setMatch(match_id)
      setTimedMode(false)
      setWaiting()
      await joinMatch(match_id)
      navigate('/game')
    } catch (err) {
      addNotification(err.message || 'Matchmaking failed', 'error')
    } finally { setLoading(null) }
  }

  async function handleCreatePrivate() {
    setLoading('private')
    try {
      const { match_id } = await rpc('create_private_match', { timed: false })
      resetMatch()
      setMatch(match_id)
      setTimedMode(false)
      setWaiting()
      await joinMatch(match_id)
      await navigator.clipboard.writeText(match_id).catch(() => {})
      addNotification(`Match ID copied! Share it with your friend.`, 'info')
      navigate('/game')
    } catch (err) {
      addNotification(err.message || 'Failed to create match', 'error')
    } finally { setLoading(null) }
  }

  async function handleJoinById() {
    if (!joinId.trim()) return
    setLoading('join')
    try {
      resetMatch()
      setMatch(joinId.trim())
      setWaiting()
      await joinMatch(joinId.trim())
      navigate('/game')
    } catch (err) {
      addNotification(err.message || 'Match not found', 'error')
    } finally { setLoading(null) }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {tooltip && <InfoModal id={tooltip} onClose={() => setTooltip(null)} />}

      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <span className="font-display text-2xl text-neon glow-neon tracking-widest">LILA</span>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/leaderboard')} className="btn-secondary px-4 py-2 text-sm font-semibold tracking-wide" style={{boxShadow: '0 0 12px rgba(0,255,178,0.2)'}}>🏆 Leaderboard</button>
          <div className="text-right">
            <p className="text-white text-sm font-semibold">{username}</p>
            <button onClick={logout} className="text-muted text-xs hover:text-coral transition-colors">Sign out</button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center mb-12 animate-slide-up">
          <h1 className="font-display text-7xl md:text-9xl tracking-widest text-white leading-none">
            TIC<br />
            <span className="text-neon glow-neon">TAC</span><br />
            TOE
          </h1>
          <p className="text-muted font-mono text-sm mt-4 tracking-widest uppercase">
            Server-authoritative · Real-time · Multiplayer
          </p>
        </div>

        <div className="w-full max-w-md space-y-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>

          {/* Mode selector */}
          <div className="panel p-1 flex gap-1">
            <button
              onClick={() => setMode('classic')}
              className={`flex-1 py-3 rounded-xl font-mono text-sm uppercase tracking-widest transition-all
                ${mode === 'classic' ? 'bg-neon text-ink font-bold' : 'text-muted hover:text-white'}`}
            >
              ♾ Classic
            </button>
            <button
              onClick={() => setTooltip('timed')}
              className="flex-1 py-3 rounded-xl font-mono text-sm uppercase tracking-widest transition-all
                text-muted/40 cursor-not-allowed relative"
            >
              ⏱ Timed
              <span className="absolute -top-1 -right-1 text-xs bg-gold/80 text-ink px-1 rounded font-bold">Soon</span>
            </button>
          </div>

          {/* Quick Play */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleQuickPlay}
              disabled={!!loading}
              className="btn-primary flex-1 text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading === 'quick' ? <><Spinner /> Finding match…</> : '⚡ Quick Play'}
            </button>
            <InfoButton id="quick" onClick={setTooltip} />
          </div>

          {/* Create Private */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreatePrivate}
              disabled={!!loading}
              className="btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading === 'private' ? <><Spinner /> Creating…</> : '🔒 Create Private Match'}
            </button>
            <InfoButton id="private" onClick={setTooltip} />
          </div>

          {/* Join by ID */}
          <div className="panel p-4 space-y-3">
            <div className="flex items-center gap-2">
              <p className="text-muted text-xs font-mono uppercase tracking-widest flex-1">Join by Match ID</p>
              <InfoButton id="join" onClick={setTooltip} />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={joinId}
                onChange={e => setJoinId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleJoinById()}
                placeholder="Paste match ID…"
                className="flex-1 bg-dim border border-border rounded-xl px-3 py-2
                           text-white font-mono text-sm placeholder-muted/40
                           focus:outline-none focus:border-neon/60 transition-all"
              />
              <button
                onClick={handleJoinById}
                disabled={!!loading || !joinId.trim()}
                className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
              >
                {loading === 'join' ? <Spinner /> : 'Join'}
              </button>
            </div>
          </div>

        </div>
      </main>

      <div className="h-px bg-gradient-to-r from-transparent via-neon/30 to-transparent" />
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
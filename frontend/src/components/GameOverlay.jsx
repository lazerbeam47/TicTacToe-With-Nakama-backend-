// components/GameOverlay.jsx
import { motion } from 'framer-motion'

const REASON_LABELS = {
  win:                   null,           // handled by winner field
  draw:                  'It\'s a Draw!',
  forfeit:               'Opponent Forfeited',
  timeout:               'Time\'s Up!',
  opponent_disconnected: 'Opponent Disconnected',
  server_shutdown:       'Server Restarting',
}

export default function GameOverlay({ result, mySymbol, username, onRematch, onExit }) {
  if (!result) return null

  const isWinner = result.winner && result.winner_id === undefined
    ? false
    : result.winner_name === username

  const isDraw   = !result.winner
  const title    = isDraw
    ? '🤝 Draw!'
    : isWinner
      ? '🏆 You Win!'
      : `${result.winner_name || result.winner} Wins!`

  const subtitle = REASON_LABELS[result.reason] || ''
  const emoji    = isDraw ? '—' : isWinner ? '🎉' : '😔'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 flex items-center justify-center z-50
                 bg-ink/80 backdrop-blur-sm rounded-2xl"
    >
      <motion.div
        initial={{ scale: 0.7, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        className="panel p-8 text-center max-w-xs w-full mx-4"
      >
        <div className="text-6xl mb-3">{emoji}</div>

        <h2 className={`font-display text-4xl tracking-wider mb-1 ${
          isDraw ? 'text-gold' : isWinner ? 'text-neon glow-neon' : 'text-coral'
        }`}>
          {title}
        </h2>

        {subtitle && (
          <p className="text-muted font-mono text-sm mb-1">{subtitle}</p>
        )}

        {result.reason === 'win' && (
          <p className="text-muted text-sm mb-5">
            {isWinner ? 'Brilliant move!' : 'Better luck next time.'}
          </p>
        )}

        <div className="flex flex-col gap-3 mt-6">
          <button onClick={onRematch} className="btn-primary">
            🔄 Request Rematch
          </button>
          <button onClick={onExit} className="btn-ghost">
            ← Back to Lobby
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

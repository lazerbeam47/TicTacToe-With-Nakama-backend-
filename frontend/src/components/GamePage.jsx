import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'
import { useNakama } from '@/hooks/useNakama'
import Board        from './Board'
import PlayerStrip  from './PlayerStrip'
import GameOverlay  from './GameOverlay'
import Timer        from './Timer'

function ForfeitModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={onCancel}>
      <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="relative panel p-7 max-w-xs w-full text-center"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-5xl mb-3">🏳️</div>
        <h3 className="font-display text-3xl text-coral tracking-wider mb-2">Forfeit?</h3>
        <p className="text-muted text-sm mb-6">
          Your opponent wins the match. This can't be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 rounded-xl font-body font-semibold text-white bg-coral/80
                       border border-coral/50 hover:bg-coral transition-all active:scale-95"
          >
            Yes, Forfeit
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function GamePage() {
  const navigate = useNavigate()
  const {
    matchId, matchPhase, board, currentTurn, mySymbol,
    players, result, timedMode, timerRemaining, username, moveNumber,
  } = useStore()

  const { makeMove, forfeit, requestRematch, exitMatch } = useNakama(matchId)
  const [showForfeit, setShowForfeit] = useState(false)

  useEffect(() => {
    if (!matchId) navigate('/', { replace: true })
  }, [matchId, navigate])

  if (!matchId) return null

  const isMyTurn    = mySymbol === currentTurn
  const winningLine = result?.winning_line || null
  const gameOver    = matchPhase === 'game_over'

  function handleForfeitConfirm() {
    setShowForfeit(false)
    forfeit()
  }

  return (
    <div className="min-h-screen flex flex-col">

      <AnimatePresence>
        {showForfeit && (
          <ForfeitModal
            onConfirm={handleForfeitConfirm}
            onCancel={() => setShowForfeit(false)}
          />
        )}
      </AnimatePresence>

      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button onClick={exitMatch} className="btn-ghost text-sm">← Lobby</button>

        <div className="flex items-center gap-2">
          <span className="font-display text-xl text-neon tracking-wider">LILA</span>
          {timedMode && (
            <span className="text-xs font-mono bg-gold/20 text-gold border border-gold/30 px-2 py-0.5 rounded-full">
              ⏱ TIMED
            </span>
          )}
        </div>

        <button
          onClick={() => setShowForfeit(true)}
          className="btn-ghost text-coral text-sm hover:text-coral"
        >
          Forfeit
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-6">
        <AnimatePresence mode="wait">
          {matchPhase === 'waiting' && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="panel px-6 py-3 text-center"
            >
              <p className="text-neon font-mono text-sm animate-pulse-neon">
                ⌛ Waiting for opponent…
              </p>
              <p className="text-muted text-xs font-mono mt-1">
                Match ID: <span className="text-white">{matchId.slice(0, 12)}…</span>
              </p>
              <button
                onClick={() => navigator.clipboard.writeText(matchId).catch(() => {})}
                className="btn-ghost text-xs mt-2"
              >
                📋 Copy Match ID
              </button>
            </motion.div>
          )}

          {matchPhase === 'playing' && (
            <motion.div
              key="status"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`panel px-6 py-2 font-mono text-sm text-center ${
                isMyTurn ? 'text-neon border-neon/40' : 'text-muted'
              }`}
            >
              {isMyTurn ? '▶ Your turn' : `Waiting for ${currentTurn}…`}
            </motion.div>
          )}
        </AnimatePresence>

        {timedMode && matchPhase === 'playing' && (
          <Timer remaining={timerRemaining} isMyTurn={isMyTurn} currentTurn={currentTurn} />
        )}

        <PlayerStrip
          players={players}
          mySymbol={mySymbol}
          currentTurn={currentTurn}
          matchPhase={matchPhase}
        />

        <div className="relative w-full max-w-xs md:max-w-sm">
          <Board
            board={board}
            winningLine={winningLine}
            isMyTurn={isMyTurn}
            mySymbol={mySymbol}
            currentTurn={currentTurn}
            onMove={makeMove}
            disabled={gameOver || matchPhase !== 'playing'}
          />

          <AnimatePresence>
            {gameOver && (
              <GameOverlay
                result={result}
                mySymbol={mySymbol}
                username={username}
                onRematch={requestRematch}
                onExit={exitMatch}
              />
            )}
          </AnimatePresence>
        </div>

        {matchPhase === 'playing' && (
          <p className="text-muted font-mono text-xs">Move #{moveNumber}</p>
        )}
      </main>
    </div>
  )
}

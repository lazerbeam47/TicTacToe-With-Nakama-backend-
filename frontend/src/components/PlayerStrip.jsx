// components/PlayerStrip.jsx
import clsx from 'clsx'

export default function PlayerStrip({ players, mySymbol, currentTurn, matchPhase }) {
  // Build a map: symbol -> player info
  const playerMap = {}
  players.forEach(p => { playerMap[p.symbol] = p })

  return (
    <div className="flex items-center justify-between gap-4 w-full max-w-xs md:max-w-sm mx-auto">
      {['X', 'O'].map((symbol) => {
        const player    = playerMap[symbol]
        const isMe      = symbol === mySymbol
        const isActive  = currentTurn === symbol && matchPhase === 'playing'

        return (
          <div
            key={symbol}
            className={clsx(
              'flex-1 panel px-4 py-3 flex items-center gap-3 transition-all duration-300',
              isActive && 'border-neon/50',
              !isActive && 'opacity-60',
            )}
          >
            {/* Symbol badge */}
            <span className={clsx(
              'font-display text-2xl leading-none',
              symbol === 'X' ? 'text-neon' : 'text-coral',
            )}
              style={{
                textShadow: symbol === 'X'
                  ? '0 0 12px #00FFB2' : '0 0 12px #FF4F6D',
              }}
            >
              {symbol}
            </span>

            <div className="min-w-0">
              <p className={clsx(
                'text-sm font-semibold truncate',
                isMe ? 'text-white' : 'text-white/80',
              )}>
                {player?.username || '…waiting'}
                {isMe && <span className="text-neon/70 text-xs ml-1">(you)</span>}
              </p>
              {isActive && (
                <p className="text-neon text-xs font-mono animate-pulse-neon">
                  ● thinking…
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

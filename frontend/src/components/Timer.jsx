// components/Timer.jsx
import { motion } from 'framer-motion'
import clsx from 'clsx'

export default function Timer({ remaining, isMyTurn, currentTurn }) {
  if (remaining === null || remaining === undefined) return null

  const total   = 30
  const pct     = Math.max(0, Math.min(1, remaining / total))
  const urgent  = remaining <= 10
  const radius  = 22
  const circ    = 2 * Math.PI * radius
  const offset  = circ * (1 - pct)

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-1"
    >
      <div className="relative w-16 h-16">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
          {/* Track */}
          <circle cx="28" cy="28" r={radius} fill="none"
            stroke="#2A2A45" strokeWidth="4" />
          {/* Progress */}
          <motion.circle
            cx="28" cy="28" r={radius} fill="none"
            stroke={urgent ? '#FF4F6D' : '#00FFB2'}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circ}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.8, ease: 'linear' }}
            style={{ filter: urgent ? 'drop-shadow(0 0 6px #FF4F6D)' : 'drop-shadow(0 0 6px #00FFB2)' }}
          />
        </svg>
        <div className={clsx(
          'absolute inset-0 flex items-center justify-center font-mono font-bold text-lg',
          urgent ? 'text-coral animate-pulse' : 'text-white'
        )}>
          {remaining}
        </div>
      </div>

      <p className="text-xs font-mono text-muted">
        {isMyTurn ? "Your turn" : `${currentTurn}'s turn`}
      </p>
    </motion.div>
  )
}

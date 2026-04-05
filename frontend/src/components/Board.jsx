// components/Board.jsx
import { motion } from 'framer-motion'
import Cell from './Cell'

export default function Board({ board, winningLine, isMyTurn, mySymbol, currentTurn, onMove, disabled }) {
  const winSet = new Set(winningLine || [])
  const isMyActualTurn = isMyTurn && currentTurn === mySymbol && !disabled

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 24 }}
      className="relative w-full max-w-xs md:max-w-sm mx-auto"
    >
      {/* Board grid */}
      <div
        className="grid grid-cols-3 gap-2"
        style={{ aspectRatio: '1' }}
      >
        {board.map((value, i) => (
          <Cell
            key={i}
            index={i}
            value={value}
            onClick={onMove}
            isWin={winSet.has(i + 1)}
            isMyTurn={isMyActualTurn}
            disabled={disabled || !isMyActualTurn}
          />
        ))}
      </div>

      {/* Grid lines overlay (decorative) */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {/* vertical lines */}
        <div className="absolute top-0 bottom-0 left-1/3 w-px bg-border/40" />
        <div className="absolute top-0 bottom-0 left-2/3 w-px bg-border/40" />
        {/* horizontal lines */}
        <div className="absolute left-0 right-0 top-1/3 h-px bg-border/40" />
        <div className="absolute left-0 right-0 top-2/3 h-px bg-border/40" />
      </div>
    </motion.div>
  )
}

// components/Cell.jsx
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'

export default function Cell({ value, index, onClick, isWin, isMyTurn, disabled }) {
  const isEmpty = value === ''

  return (
    <motion.button
      whileTap={isEmpty && !disabled ? { scale: 0.92 } : {}}
      onClick={() => isEmpty && !disabled && onClick(index)}
      className={clsx(
        'cell',
        value === 'X' && 'cell--x',
        value === 'O' && 'cell--o',
        !isEmpty && 'cell--taken',
        isWin && 'cell--win',
        isEmpty && isMyTurn && !disabled && 'hover:border-neon/60',
      )}
      aria-label={`Cell ${index + 1}: ${value || 'empty'}`}
    >
      <AnimatePresence>
        {value && (
          <motion.span
            key={value + index}
            initial={{ scale: 0, rotate: -15, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="select-none"
            style={{
              textShadow: value === 'X'
                ? '0 0 24px #00FFB2, 0 0 48px #00FFB240'
                : '0 0 24px #FF4F6D, 0 0 48px #FF4F6D40',
            }}
          >
            {value}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Hover hint */}
      {isEmpty && isMyTurn && !disabled && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          className="absolute text-4xl font-display select-none pointer-events-none text-neon"
        >
          ·
        </motion.span>
      )}
    </motion.button>
  )
}

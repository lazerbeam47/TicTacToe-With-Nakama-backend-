// components/NotificationStack.jsx
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '@/lib/store'
import clsx from 'clsx'

const TYPE_STYLES = {
  info:  'border-neon/40 bg-neon/10 text-neon',
  warn:  'border-gold/40 bg-gold/10 text-gold',
  error: 'border-coral/40 bg-coral/10 text-coral',
}

export default function NotificationStack() {
  const notifications = useStore(s => s.notifications)

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-xs w-full pointer-events-none">
      <AnimatePresence>
        {notifications.map(n => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0,  scale: 1   }}
            exit={{   opacity: 0, x: 60,  scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className={clsx(
              'panel px-4 py-3 text-sm font-mono border',
              TYPE_STYLES[n.type] || TYPE_STYLES.info,
            )}
          >
            {n.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

import { motion } from 'framer-motion'

interface Props {
  message: string
  color: string
}

/** The warm "one moment" state shown during the organic delay. */
export function PreparingOverlay({ message, color }: Props) {
  return (
    <motion.div
      key="preparing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 rounded-full bg-ivory/75 backdrop-blur-[3px]"
      role="status"
      aria-live="polite"
    >
      <div className="relative h-16 w-16">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute inset-0 rounded-[46%_54%_52%_48%/55%_45%_55%_45%]"
            style={{ backgroundColor: color }}
            initial={{ scale: 0.4, opacity: 0.35 }}
            animate={{ scale: [0.4, 1.15], opacity: [0.35, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.8, ease: 'easeOut' }}
          />
        ))}
        <motion.span
          className="absolute inset-4 rounded-[46%_54%_52%_48%/55%_45%_55%_45%]"
          style={{ backgroundColor: color }}
          animate={{ scale: [0.92, 1.06, 0.92], rotate: [0, 12, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      <motion.p
        initial={{ y: 6, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 120, damping: 18 }}
        className="max-w-[14rem] text-center font-display text-lg text-charcoal"
      >
        {message}
      </motion.p>
    </motion.div>
  )
}

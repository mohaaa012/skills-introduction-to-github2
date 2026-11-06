import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export function Toast({ message }: { message: string | null }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-30 flex justify-center px-4" aria-live="polite">
      <AnimatePresence mode="wait">
        {message && (
          <motion.div
            key={message}
            initial={{ y: 24, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            className="flex items-center gap-2.5 rounded-full border border-sand bg-ivory px-5 py-3 text-sm text-charcoal shadow-md"
          >
            <Sparkles className="h-4 w-4 text-amber-soft" strokeWidth={2} />
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

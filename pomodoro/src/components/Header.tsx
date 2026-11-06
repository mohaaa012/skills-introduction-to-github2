import { motion } from 'framer-motion'
import { SlidersHorizontal } from 'lucide-react'
import { greeting } from '../lib/time'

export function Header({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <motion.svg
          viewBox="0 0 64 64"
          className="h-10 w-10"
          aria-hidden
          animate={{ rotate: [0, 4, -3, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path fill="#C86D51" d="M32 6c11 0 23 7 25 19 2 11-3 24-14 30-9 5-22 3-29-5C7 42 5 30 10 20 14 12 23 6 32 6Z" />
          <path fill="#F7F4EF" d="M33 17c-1 6 4 9 4 15a6 6 0 0 1-12 1c0-4 3-6 3-10 3 2 3 4 3 6 2-3 2-8 2-12Z" />
        </motion.svg>
        <div>
          <p className="font-display text-2xl leading-none text-charcoal">Hearth</p>
          <p className="mt-1 text-sm text-pebble">
            {greeting()}.<span className="hidden sm:inline"> Let’s make today feel good.</span>
          </p>
        </div>
      </div>
      <motion.button
        type="button"
        onClick={onOpenSettings}
        whileTap={{ scale: 0.95 }}
        className="inline-flex items-center gap-2 rounded-full border border-sand bg-ivory px-4 py-2.5 text-sm font-medium text-charcoal/80 shadow-sm transition-colors hover:text-charcoal"
      >
        <SlidersHorizontal className="h-4 w-4" strokeWidth={1.8} />
        <span className="hidden sm:inline">Settings</span>
        <span className="sr-only sm:hidden">Settings</span>
      </motion.button>
    </header>
  )
}

import { motion } from 'framer-motion'
import { MODE_META } from '../lib/copy'
import type { Mode } from '../lib/types'

const MODES: Mode[] = ['focus', 'short', 'long']

interface Props {
  mode: Mode
  disabled: boolean
  onChange: (mode: Mode) => void
}

export function ModeSwitcher({ mode, disabled, onChange }: Props) {
  return (
    <div role="tablist" aria-label="Timer mode" className="relative flex w-full max-w-sm rounded-full bg-sand/60 p-1">
      {MODES.map((m) => {
        const active = m === mode
        return (
          <button
            key={m}
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(m)}
            className={`relative flex-1 rounded-full px-2 py-2 text-[13px] font-medium whitespace-nowrap transition-colors duration-500 disabled:cursor-wait min-[380px]:text-sm ${
              active ? 'text-charcoal' : 'text-pebble hover:text-charcoal'
            }`}
          >
            {active && (
              <motion.span
                layoutId="mode-pill"
                className="absolute inset-0 rounded-full bg-ivory shadow-sm"
                transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              />
            )}
            <span className="relative">{MODE_META[m].tab}</span>
          </button>
        )
      })}
    </div>
  )
}

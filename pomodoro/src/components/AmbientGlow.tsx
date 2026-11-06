import { motion, useReducedMotion } from 'framer-motion'
import type { Mode } from '../lib/types'

/** Two soft light pools behind everything, warming or cooling with the mode. */
export function AmbientGlow({ mode }: { mode: Mode }) {
  const reduce = useReducedMotion()
  const focus = mode === 'focus'
  const drift = (x: number[], y: number[], duration: number) =>
    reduce ? {} : { animate: { x, y }, transition: { duration, repeat: Infinity, repeatType: 'mirror' as const, ease: 'easeInOut' as const } }

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      <motion.div className="absolute -top-[20vmax] -left-[15vmax]" {...drift([0, 60, -20], [0, 40, 10], 26)}>
        <div
          className="h-[60vmax] w-[60vmax] rounded-full blur-3xl transition-colors duration-[2000ms]"
          style={{ backgroundColor: focus ? 'rgb(200 109 81 / 0.14)' : 'rgb(88 123 106 / 0.16)' }}
        />
      </motion.div>
      <motion.div className="absolute -right-[18vmax] -bottom-[25vmax]" {...drift([0, -50, 10], [0, -30, 0], 32)}>
        <div className="h-[55vmax] w-[55vmax] rounded-full bg-amber-soft/[0.12] blur-3xl" />
      </motion.div>
    </div>
  )
}

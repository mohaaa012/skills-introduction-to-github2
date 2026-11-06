import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useEffect } from 'react'

/** Pigment drops: position (vw/vh %), size, colour, when they land */
const DROPS = [
  { x: 50, y: 46, size: 70, color: '#E6A15C', delay: 0 },
  { x: 32, y: 36, size: 46, color: '#C86D51', delay: 0.25 },
  { x: 68, y: 60, size: 50, color: '#587B6A', delay: 0.45 },
  { x: 62, y: 30, size: 34, color: '#E6A15C', delay: 0.65 },
  { x: 36, y: 66, size: 38, color: '#C86D51', delay: 0.8 },
  { x: 80, y: 42, size: 26, color: '#C86D51', delay: 1.0 },
  { x: 20, y: 52, size: 28, color: '#587B6A', delay: 1.1 },
]

interface Props {
  open: boolean
  goal: number
  onClose: () => void
}

/**
 * Daily-goal celebration: soft pigment that blooms and bleeds like watercolour
 * on damp paper (turbulence-displaced, blurred, multiplied), then a kind note.
 */
export function WatercolorBloom({ open, goal, onClose }: Props) {
  const reduce = useReducedMotion()

  useEffect(() => {
    if (!open) return
    const id = window.setTimeout(onClose, 12_000)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(id)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center overflow-hidden bg-clay/70 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.9 } }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Daily goal reached"
        >
          <svg className="absolute h-0 w-0" aria-hidden>
            <filter id="watercolor" x="-30%" y="-30%" width="160%" height="160%">
              <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed="7" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="70" xChannelSelector="R" yChannelSelector="G" result="bleed" />
              <feGaussianBlur in="bleed" stdDeviation="10" />
            </filter>
          </svg>

          <div className="pointer-events-none absolute inset-0" style={{ filter: 'url(#watercolor)' }} aria-hidden>
            {DROPS.map((d, i) => (
              <motion.span
                key={i}
                className="absolute rounded-full mix-blend-multiply"
                style={{
                  left: `${d.x}%`,
                  top: `${d.y}%`,
                  width: `${d.size}vmin`,
                  height: `${d.size}vmin`,
                  marginLeft: `-${d.size / 2}vmin`,
                  marginTop: `-${d.size / 2}vmin`,
                  background: `radial-gradient(circle at 45% 40%, ${d.color}cc 0%, ${d.color}88 45%, ${d.color}22 70%, transparent 74%)`,
                }}
                initial={reduce ? { opacity: 0 } : { scale: 0.05, opacity: 0 }}
                animate={reduce ? { opacity: 0.55 } : { scale: [0.05, 1.06, 1], opacity: [0, 0.75, 0.55] }}
                transition={{ duration: 2.6, delay: d.delay, ease: [0.22, 0.8, 0.3, 1] }}
              />
            ))}
          </div>

          <motion.div
            className="relative max-w-sm rounded-3xl bg-ivory/90 px-8 py-9 text-center shadow-lg backdrop-blur-sm"
            initial={{ y: 24, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0, transition: { duration: 0.4 } }}
            transition={{ delay: 1.1, type: 'spring', stiffness: 120, damping: 18 }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.span
              className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-amber-soft/20 text-amber-soft"
              animate={reduce ? undefined : { rotate: [0, 8, -6, 0], scale: [1, 1.08, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles className="h-7 w-7" strokeWidth={1.7} />
            </motion.span>
            <h2 className="mt-5 font-display text-3xl text-charcoal">You did it.</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-charcoal/75">
              {goal} Quality {goal === 1 ? 'Block' : 'Blocks'} today. You showed up for yourself, and that matters more
              than any number.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-7 rounded-full bg-terracotta px-6 py-3 text-sm font-semibold text-ivory shadow-sm transition-colors hover:bg-terracotta-deep"
            >
              Thank you, I’ll take it
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

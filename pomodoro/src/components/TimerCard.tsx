import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { Pending } from '../hooks/usePomodoro'
import { MODE_META } from '../lib/copy'
import { formatClock } from '../lib/time'
import { toneFor } from '../lib/tone'
import { isRest, type Mode, type TimerStatus } from '../lib/types'
import { Controls } from './Controls'
import { ModeSwitcher } from './ModeSwitcher'
import { OrganicRing } from './OrganicRing'
import { PreparingOverlay } from './PreparingOverlay'

interface Props {
  mode: Mode
  status: TimerStatus
  remainingMs: number
  durationMs: number
  endAt: number | null
  progress: number
  cycle: number
  longEvery: number
  pending: Pending | null
  intention: string
  onIntention: (value: string) => void
  onStart: () => void
  onPause: () => void
  onReset: () => void
  onSkip: () => void
  onMode: (mode: Mode) => void
}

export function TimerCard(props: Props) {
  const { mode, status, remainingMs, durationMs, endAt, progress, cycle, longEvery, pending } = props
  const tone = toneFor(mode)
  const meta = MODE_META[mode]
  const rest = isRest(mode)
  const running = status === 'running'
  const caption = status === 'paused' ? 'paused' : running ? 'until your next rest' : rest ? 'to recharge' : 'just for this'

  return (
    <section className="card relative flex flex-col items-center gap-7 overflow-hidden px-4 py-7 sm:px-10 sm:py-10">
      <ModeSwitcher mode={mode} disabled={pending != null} onChange={props.onMode} />

      <AnimatePresence mode="wait" initial={false}>
        {rest ? (
          <motion.p
            key="rest-note"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="h-11 text-center text-sm text-pebble"
          >
            No tasks here. This time belongs to you.
          </motion.p>
        ) : (
          <motion.label
            key="intention"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="w-full max-w-sm"
          >
            <span className="sr-only">Your intention for this block</span>
            <input
              value={props.intention}
              onChange={(e) => props.onIntention(e.target.value)}
              maxLength={80}
              placeholder="What deserves your attention?"
              className="h-11 w-full rounded-2xl border border-transparent bg-clay/70 px-4 text-center text-[15px] text-charcoal placeholder:text-pebble/80 transition-colors focus:border-terracotta/30 focus:bg-ivory focus:outline-none"
            />
          </motion.label>
        )}
      </AnimatePresence>

      <div className="relative aspect-square w-full max-w-[21rem]">
        <OrganicRing
          color={tone.hex}
          progress={progress}
          running={running}
          endAt={endAt}
          durationMs={durationMs}
          breathing={rest}
          label={`${Math.round(progress * 100)}% through ${meta.label}`}
        />
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            key={mode}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-xs font-semibold uppercase tracking-[0.22em] ${tone.text}`}
          >
            {meta.label}
          </motion.span>
          <span
            className="mt-2 font-display text-[4.25rem] leading-none font-light text-charcoal tabular-nums sm:text-[4.75rem]"
            aria-live="off"
          >
            {formatClock(remainingMs)}
          </span>
          <span className="mt-3 h-5 text-sm text-pebble">
            {rest && running ? <BreathCaption /> : <SoftText text={caption} />}
          </span>
        </div>
        <AnimatePresence>{pending && <PreparingOverlay message={pending.message} color={tone.hex} />}</AnimatePresence>
      </div>

      <p className="min-h-6 text-center text-[15px] text-charcoal/80" aria-live="polite">
        {pending ? ' ' : meta.prompts[status]}
      </p>

      <Controls
        mode={mode}
        status={status}
        busy={pending != null}
        canReset={status !== 'idle' || remainingMs < durationMs}
        onStart={props.onStart}
        onPause={props.onPause}
        onReset={props.onReset}
        onSkip={props.onSkip}
      />

      <CycleTrail cycle={cycle} longEvery={longEvery} mode={mode} />
    </section>
  )
}

/** Little pebbles showing where you are on the way to a long rest. */
function CycleTrail({ cycle, longEvery, mode }: { cycle: number; longEvery: number; mode: Mode }) {
  const done = mode === 'long' ? longEvery : cycle % longEvery
  const left = longEvery - done
  const text =
    mode === 'long'
      ? 'A full cycle. Enjoy the long rest.'
      : left === 1
        ? 'One more block, then a long rest.'
        : `${left} blocks until a long rest.`
  return (
    <div className="flex items-center gap-3 text-xs text-pebble">
      <div className="flex gap-1.5" aria-hidden>
        {Array.from({ length: longEvery }, (_, i) => (
          <motion.span
            key={i}
            className="h-2 w-2 rounded-full"
            initial={false}
            animate={{ backgroundColor: i < done ? '#E6A15C' : '#EBE5DC', scale: i < done ? 1 : 0.85 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: i * 0.04 }}
          />
        ))}
      </div>
      <span>{text}</span>
    </div>
  )
}

function SoftText({ text }: { text: string }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={text}
        className="block"
        initial={{ opacity: 0, filter: 'blur(4px)' }}
        animate={{ opacity: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, filter: 'blur(4px)' }}
        transition={{ duration: 0.9 }}
      >
        {text}
      </motion.span>
    </AnimatePresence>
  )
}

/**
 * "Breathe in" / "Breathe out" on a calm 4-second rhythm, in step with the ring's
 * inner shape. Mounting restarts the cycle, so it always begins with an inhale.
 */
function BreathCaption() {
  const [inhale, setInhale] = useState(true)
  useEffect(() => {
    const id = window.setInterval(() => setInhale((v) => !v), 4000)
    return () => window.clearInterval(id)
  }, [])
  return <SoftText text={inhale ? 'breathe in…' : 'breathe out…'} />
}

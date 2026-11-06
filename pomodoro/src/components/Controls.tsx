import { motion } from 'framer-motion'
import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react'
import type { ReactNode } from 'react'
import { MODE_META } from '../lib/copy'
import { toneFor } from '../lib/tone'
import type { Mode, TimerStatus } from '../lib/types'

interface Props {
  mode: Mode
  status: TimerStatus
  busy: boolean
  canReset: boolean
  onStart: () => void
  onPause: () => void
  onReset: () => void
  onSkip: () => void
}

const spring = { type: 'spring', stiffness: 400, damping: 22 } as const

export function Controls({ mode, status, busy, canReset, onStart, onPause, onReset, onSkip }: Props) {
  const tone = toneFor(mode)
  const running = status === 'running'
  const label = busy ? 'One moment…' : running ? 'Pause' : status === 'paused' ? 'Resume' : MODE_META[mode].start
  // Narrow phones get a one-word label so all three buttons fit on one line
  const short = busy ? 'A moment…' : running ? 'Pause' : status === 'paused' ? 'Resume' : mode === 'focus' ? 'Begin' : 'Rest'

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-5">
      <SoftIconButton label="Start this block over" onClick={onReset} disabled={busy || !canReset}>
        <RotateCcw className="h-5 w-5" strokeWidth={1.8} />
      </SoftIconButton>

      <motion.button
        type="button"
        onClick={running ? onPause : onStart}
        disabled={busy}
        whileHover={busy ? undefined : { scale: 1.03 }}
        whileTap={busy ? undefined : { scale: 0.96 }}
        transition={spring}
        className={`inline-flex min-w-[8.5rem] items-center justify-center gap-2.5 rounded-full px-6 py-4 text-base font-semibold whitespace-nowrap min-[380px]:min-w-[11.5rem] sm:px-7 text-ivory shadow-md transition-colors duration-700 disabled:cursor-wait ${tone.bg} ${tone.hover}`}
        aria-keyshortcuts="Space"
      >
        {busy ? (
          <motion.span
            className="h-2.5 w-2.5 rounded-full bg-ivory"
            animate={{ scale: [0.7, 1.2, 0.7], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
        ) : running ? (
          <Pause className="h-5 w-5" fill="currentColor" strokeWidth={0} />
        ) : (
          <Play className="h-5 w-5" fill="currentColor" strokeWidth={0} />
        )}
        <span className="min-[380px]:hidden">{short}</span>
        <span className="hidden min-[380px]:inline">{label}</span>
      </motion.button>

      <SoftIconButton label={mode === 'focus' ? 'Move on to a rest' : 'Move on to focus'} onClick={onSkip} disabled={busy}>
        <SkipForward className="h-5 w-5" strokeWidth={1.8} />
      </SoftIconButton>
    </div>
  )
}

function SoftIconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.06, rotate: -4 }}
      whileTap={disabled ? undefined : { scale: 0.92 }}
      transition={spring}
      className="grid h-11 w-11 shrink-0 place-items-center rounded-full min-[380px]:h-12 min-[380px]:w-12 border border-sand bg-ivory text-charcoal/70 shadow-sm transition-colors hover:text-charcoal disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </motion.button>
  )
}

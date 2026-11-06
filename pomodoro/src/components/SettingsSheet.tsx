import { AnimatePresence, motion } from 'framer-motion'
import { Minus, Plus, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CLOSE_ENOUGH } from '../hooks/usePomodoro'
import { PREPARING, pick } from '../lib/copy'
import { organicPause } from '../lib/latency'
import type { Settings } from '../lib/types'

interface Props {
  open: boolean
  settings: Settings
  onClose: () => void
  onSave: (settings: Settings) => void
}

export function SettingsSheet({ open, settings, onClose, onSave }: Props) {
  return (
    <AnimatePresence>
      {open && <SheetBody settings={settings} onClose={onClose} onSave={onSave} />}
    </AnimatePresence>
  )
}

function SheetBody({ settings, onClose, onSave }: Omit<Props, 'open'>) {
  const [draft, setDraft] = useState(settings)
  const [saving, setSaving] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    panelRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, saving])

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setDraft((d) => ({ ...d, [key]: value }))

  const save = async () => {
    setSaving(pick(PREPARING.settings))
    await organicPause()
    onSave(draft)
  }

  return (
    <motion.div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center sm:p-6">
      <motion.div
        className="absolute inset-0 bg-charcoal/25 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => !saving && onClose()}
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        tabIndex={-1}
        initial={{ y: 40, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 30, opacity: 0, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 220, damping: 26 }}
        className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-ivory p-6 shadow-lg focus:outline-none sm:rounded-3xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="settings-title" className="font-display text-2xl text-charcoal">
              Make it yours
            </h2>
            <p className="mt-1 text-sm text-pebble">There are no wrong numbers. Choose what feels kind.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving != null}
            aria-label="Close settings"
            className="grid h-10 w-10 place-items-center rounded-full text-pebble transition-colors hover:bg-clay hover:text-charcoal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <fieldset disabled={saving != null} className="mt-6 space-y-1">
          <legend className="sr-only">Durations</legend>
          <Stepper label="Deep Focus" hint="Minutes per block" value={draft.focusMinutes} min={5} max={90} step={5} onChange={(v) => set('focusMinutes', v)} />
          <Stepper label="Short Rest" hint="A quick breather" value={draft.shortMinutes} min={1} max={30} onChange={(v) => set('shortMinutes', v)} />
          <Stepper label="Long Rest" hint="A proper pause" value={draft.longMinutes} min={5} max={60} step={5} onChange={(v) => set('longMinutes', v)} />
          <Stepper label="Long rest after" hint="Quality Blocks per cycle" unit="blocks" value={draft.longEvery} min={2} max={8} onChange={(v) => set('longEvery', v)} />
          <Stepper label="Daily goal" hint="An invitation, not a rule" unit="blocks" value={draft.dailyGoal} min={1} max={16} onChange={(v) => set('dailyGoal', v)} />
        </fieldset>

        <fieldset disabled={saving != null} className="mt-4 space-y-1 border-t border-sand pt-4">
          <legend className="sr-only">Flow</legend>
          <Switch label="Start rests on their own" hint="Flow straight into your break" checked={draft.autoStartRest} onChange={(v) => set('autoStartRest', v)} />
          <Switch label="Start focus on their own" hint="Off by default: come back when you’re ready" checked={draft.autoStartFocus} onChange={(v) => set('autoStartFocus', v)} />
          <Switch label="Gentle chime" hint="A soft two-note bell when a session ends" checked={draft.chime} onChange={(v) => set('chime', v)} />
        </fieldset>

        <p className="mt-5 rounded-2xl bg-clay px-4 py-3 text-sm text-charcoal/75">
          Ending a focus block after {Math.round(CLOSE_ENOUGH * 100)}% still counts as a Quality Block. Close enough is
          good enough.
        </p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={saving != null}
            className="rounded-full px-5 py-3 text-sm font-medium text-pebble transition-colors hover:bg-clay hover:text-charcoal disabled:opacity-40"
          >
            Never mind
          </button>
          <motion.button
            type="button"
            onClick={save}
            disabled={saving != null}
            whileTap={{ scale: 0.97 }}
            className="relative inline-flex min-w-[12rem] items-center justify-center gap-2 rounded-full bg-charcoal px-6 py-3 text-sm font-semibold text-clay shadow-sm transition-colors hover:bg-charcoal/90 disabled:cursor-wait"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={saving ?? 'idle'}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center gap-2"
              >
                {saving && (
                  <motion.span
                    className="h-2 w-2 rounded-full bg-amber-soft"
                    animate={{ scale: [0.7, 1.2, 0.7] }}
                    transition={{ duration: 1.3, repeat: Infinity }}
                  />
                )}
                {saving ?? 'Save preferences'}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function Stepper(props: {
  label: string
  hint: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (value: number) => void
}) {
  const { label, hint, value, min, max, step = 1, unit = 'min', onChange } = props
  const clamp = (v: number) => Math.min(max, Math.max(min, v))
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div>
        <p className="text-[15px] font-medium text-charcoal">{label}</p>
        <p className="text-xs text-pebble">{hint}</p>
      </div>
      <div className="flex items-center gap-1 rounded-full bg-clay p-1">
        <StepButton label={`Less ${label}`} disabled={value <= min} onClick={() => onChange(clamp(value - step))}>
          <Minus className="h-4 w-4" />
        </StepButton>
        <motion.span
          key={value}
          initial={{ y: -4, opacity: 0.4 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-[4.5rem] text-center text-sm tabular-nums"
          aria-live="polite"
        >
          <span className="font-semibold text-charcoal">{value}</span> <span className="text-pebble">{unit}</span>
        </motion.span>
        <StepButton label={`More ${label}`} disabled={value >= max} onClick={() => onChange(clamp(value + step))}>
          <Plus className="h-4 w-4" />
        </StepButton>
      </div>
    </div>
  )
}

function StepButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.88 }}
      className="grid h-8 w-8 place-items-center rounded-full bg-ivory text-charcoal/80 shadow-sm transition-colors hover:text-charcoal disabled:opacity-35"
    >
      {children}
    </motion.button>
  )
}

function Switch({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-2.5">
      <span>
        <span className="block text-[15px] font-medium text-charcoal">{label}</span>
        <span className="block text-xs text-pebble">{hint}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-500 ${checked ? 'bg-sage' : 'bg-sand'}`}
      >
        <motion.span
          className="absolute top-1 left-1 h-5 w-5 rounded-full bg-ivory shadow-sm"
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
        />
      </button>
    </label>
  )
}

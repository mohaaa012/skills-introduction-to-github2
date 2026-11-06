import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { PREPARING, pick, type PendingKind } from '../lib/copy'
import { organicPause } from '../lib/latency'
import { isRest, minutesFor, type Mode, type Settings, type TimerStatus } from '../lib/types'
import { usePersistentState } from './usePersistentState'

/** Ending a focus block after this share of it still counts. Effort over perfection. */
export const CLOSE_ENOUGH = 0.8
/** Shorter than this and it was probably a misclick, not effort. */
const MIN_EFFORT_MS = 10_000

interface TimerSnapshot {
  mode: Mode
  status: TimerStatus
  durationMs: number
  /** Authoritative while idle/paused */
  remainingMs: number
  /** Authoritative while running: timestamps survive throttled background tabs */
  endAt: number | null
  /** Quality Blocks since the last long rest */
  cycle: number
}

export interface Pending {
  kind: PendingKind
  message: string
}

export interface FocusSettled {
  focusedMs: number
  durationMs: number
  isBlock: boolean
  completed: boolean
}

interface Options {
  settings: Settings
  onFocusSettled: (info: FocusSettled) => void
  onSessionEnd: (mode: Mode) => void
  onRestEnd: () => void
  /** Called once per real user gesture that starts something, to unlock audio */
  onGesture?: () => void
}

const fresh = (mode: Mode, settings: Settings, cycle: number): TimerSnapshot => {
  const durationMs = minutesFor(mode, settings) * 60_000
  return { mode, status: 'idle', durationMs, remainingMs: durationMs, endAt: null, cycle: mode === 'long' ? 0 : cycle }
}

const remainingOf = (t: TimerSnapshot, now: number) =>
  t.status === 'running' && t.endAt != null ? Math.max(0, t.endAt - now) : t.remainingMs

const nextMode = (mode: Mode, cycle: number, s: Settings): Mode => {
  if (isRest(mode)) return 'focus'
  return cycle > 0 && cycle % s.longEvery === 0 ? 'long' : 'short'
}

/** Stop the clock where it is (used while a transition breathes). */
const freeze = (t: TimerSnapshot, now: number): TimerSnapshot => ({
  ...t,
  status: t.status === 'idle' ? 'idle' : 'paused',
  remainingMs: remainingOf(t, now),
  endAt: null,
})

export function usePomodoro({ settings, onFocusSettled, onSessionEnd, onRestEnd, onGesture }: Options) {
  const [timer, setTimer] = usePersistentState<TimerSnapshot>('timer', () => fresh('focus', settings, 0))
  const [pending, setPending] = useState<Pending | null>(null)
  /** Live countdown while running, tagged with the run it belongs to */
  const [live, setLive] = useState<{ endAt: number; ms: number } | null>(() =>
    // A run restored from a previous visit: start from the real time left, not the saved snapshot
    timer.status === 'running' && timer.endAt != null ? { endAt: timer.endAt, ms: timer.endAt - Date.now() } : null,
  )

  // Refs keep async flows and intervals reading the latest values
  const timerRef = useRef(timer)
  const settingsRef = useRef(settings)
  const callbacks = useRef({ onFocusSettled, onSessionEnd, onRestEnd, onGesture })
  const busy = useRef(false)
  useLayoutEffect(() => {
    timerRef.current = timer
    settingsRef.current = settings
    callbacks.current = { onFocusSettled, onSessionEnd, onRestEnd, onGesture }
  })

  const commit = useCallback(
    (next: TimerSnapshot) => {
      timerRef.current = next
      setTimer(next)
    },
    [setTimer],
  )

  /** Hold everything still, show a warm message, then let the change happen. */
  const breathe = useCallback(async (kind: PendingKind, apply: () => void) => {
    setPending({ kind, message: pick(PREPARING[kind]) })
    await organicPause()
    apply()
    setPending(null)
    busy.current = false
  }, [])

  const claim = () => {
    if (busy.current) return false
    busy.current = true
    return true
  }

  /** Credit any focus effort in the current block; returns the updated cycle count. */
  const settle = (t: TimerSnapshot, now: number, completed: boolean): number => {
    if (t.mode !== 'focus') return t.cycle
    const focusedMs = completed ? t.durationMs : t.durationMs - remainingOf(t, now)
    if (!completed && focusedMs < MIN_EFFORT_MS) return t.cycle
    const isBlock = completed || focusedMs >= t.durationMs * CLOSE_ENOUGH
    callbacks.current.onFocusSettled({ focusedMs, durationMs: t.durationMs, isBlock, completed })
    return isBlock ? t.cycle + 1 : t.cycle
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  const start = useCallback(() => {
    const t = timerRef.current
    callbacks.current.onGesture?.()
    if (t.status === 'running' || busy.current) return
    if (t.status === 'paused') {
      // Resuming is instant: you were already here.
      commit({ ...t, status: 'running', endAt: Date.now() + t.remainingMs })
      return
    }
    if (!claim()) return
    void breathe(isRest(t.mode) ? 'start-rest' : 'start-focus', () => {
      const latest = timerRef.current
      commit({ ...latest, status: 'running', endAt: Date.now() + latest.remainingMs })
    })
  }, [breathe, commit])

  const pause = useCallback(() => {
    const t = timerRef.current
    if (t.status !== 'running' || busy.current) return
    commit(freeze(t, Date.now()))
  }, [commit])

  const reset = useCallback(() => {
    const t = timerRef.current
    if (busy.current) return
    const cycle = settle(t, Date.now(), false)
    commit(fresh(t.mode, settingsRef.current, cycle))
  }, [commit])

  const switchMode = useCallback(
    (mode: Mode) => {
      const t = timerRef.current
      callbacks.current.onGesture?.()
      if (mode === t.mode && t.status === 'idle') return
      if (!claim()) return
      const now = Date.now()
      const cycle = settle(t, now, false)
      commit({ ...freeze(t, now), cycle })
      void breathe('mode', () => commit(fresh(mode, settingsRef.current, cycle)))
    },
    [breathe, commit],
  )

  const skip = useCallback(() => {
    const t = timerRef.current
    callbacks.current.onGesture?.()
    if (!claim()) return
    const now = Date.now()
    const cycle = settle(t, now, false)
    commit({ ...freeze(t, now), cycle })
    void breathe('mode', () => commit(fresh(nextMode(t.mode, cycle, settingsRef.current), settingsRef.current, cycle)))
  }, [breathe, commit])

  const complete = useCallback(() => {
    if (!claim()) return
    const t = timerRef.current
    const s = settingsRef.current
    const cycle = settle(t, Date.now(), true)
    commit({ ...t, status: 'paused', remainingMs: 0, endAt: null, cycle })
    callbacks.current.onSessionEnd(t.mode)
    if (isRest(t.mode)) callbacks.current.onRestEnd()

    const upcoming = nextMode(t.mode, cycle, s)
    const autoStart = isRest(upcoming) ? s.autoStartRest : s.autoStartFocus
    void breathe(isRest(t.mode) ? 'complete-rest' : 'complete-focus', () => {
      const next = fresh(upcoming, settingsRef.current, cycle)
      commit(autoStart ? { ...next, status: 'running', endAt: Date.now() + next.durationMs } : next)
    })
  }, [breathe, commit])

  // ── Ticking ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (timer.status !== 'running' || timer.endAt == null) return
    const endAt = timer.endAt
    const id = window.setInterval(() => {
      const ms = endAt - Date.now()
      if (ms <= 0) complete()
      // Only re-render when the visible second changes
      else setLive((prev) => (prev?.endAt === endAt && Math.ceil(prev.ms / 1000) === Math.ceil(ms / 1000) ? prev : { endAt, ms }))
    }, 250)
    return () => window.clearInterval(id)
  }, [timer.status, timer.endAt, complete])

  // New durations apply right away to a block that hasn't started yet
  useEffect(() => {
    const t = timerRef.current
    if (t.status !== 'idle' || busy.current) return
    const durationMs = minutesFor(t.mode, settings) * 60_000
    if (durationMs !== t.durationMs) commit({ ...t, durationMs, remainingMs: durationMs })
  }, [settings, commit])

  // When a run has just begun, timer.remainingMs is still exactly right until the first tick
  const remainingMs =
    timer.status === 'running' && live?.endAt === timer.endAt ? Math.max(0, live.ms) : timer.remainingMs

  return {
    mode: timer.mode,
    status: timer.status,
    durationMs: timer.durationMs,
    remainingMs,
    endAt: timer.endAt,
    progress: timer.durationMs > 0 ? 1 - remainingMs / timer.durationMs : 0,
    cycle: timer.cycle,
    pending,
    start,
    pause,
    reset,
    skip,
    switchMode,
  }
}

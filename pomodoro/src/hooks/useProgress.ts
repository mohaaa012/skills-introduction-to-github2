import { useCallback, useLayoutEffect, useMemo, useRef } from 'react'
import { INITIAL_UNLOCKED, QUOTES } from '../lib/quotes'
import { computeRhythm } from '../lib/rhythm'
import type { History } from '../lib/types'
import { usePersistentState } from './usePersistentState'

interface ProgressState {
  history: History
  /** How many quotes from QUOTES are unlocked (they unlock in order) */
  unlocked: number
  /** Highest quote index already shown, so new ones can be introduced first */
  seenUpTo: number
  bestRhythm: number
  celebratedOn: string | null
}

const INITIAL: ProgressState = {
  history: {},
  unlocked: INITIAL_UNLOCKED,
  seenUpTo: -1,
  bestRhythm: 0,
  celebratedOn: null,
}

export interface RecordResult {
  reachedGoal: boolean
  unlockedQuote: boolean
}

export function useProgress(today: string, dailyGoal: number) {
  const [state, setState] = usePersistentState<ProgressState>('progress', INITIAL)
  const ref = useRef(state)
  useLayoutEffect(() => {
    ref.current = state
  }, [state])

  const record = useCallback(
    (focusedMs: number, isBlock: boolean): RecordResult => {
      const prev = ref.current
      const day = prev.history[today] ?? { blocks: 0, minutes: 0 }
      const blocks = day.blocks + (isBlock ? 1 : 0)
      const minutes = Math.round((day.minutes + focusedMs / 60_000) * 10) / 10
      const history = { ...prev.history, [today]: { blocks, minutes } }
      const unlockedQuote = isBlock && prev.unlocked < QUOTES.length
      const reachedGoal = isBlock && day.blocks < dailyGoal && blocks >= dailyGoal && prev.celebratedOn !== today
      const next: ProgressState = {
        ...prev,
        history,
        unlocked: unlockedQuote ? prev.unlocked + 1 : prev.unlocked,
        bestRhythm: Math.max(prev.bestRhythm, computeRhythm(history, today).days),
        celebratedOn: reachedGoal ? today : prev.celebratedOn,
      }
      ref.current = next
      setState(next)
      return { reachedGoal, unlockedQuote }
    },
    [today, dailyGoal, setState],
  )

  const markSeen = useCallback(
    (index: number) => setState((s) => (index > s.seenUpTo ? { ...s, seenUpTo: index } : s)),
    [setState],
  )

  const rhythm = useMemo(() => computeRhythm(state.history, today), [state.history, today])
  const todayRecord = state.history[today] ?? { blocks: 0, minutes: 0 }

  return {
    history: state.history,
    today: todayRecord,
    rhythm,
    bestRhythm: Math.max(state.bestRhythm, rhythm.days),
    unlocked: state.unlocked,
    seenUpTo: state.seenUpTo,
    record,
    markSeen,
  }
}

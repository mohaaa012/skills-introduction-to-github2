import { addDays } from './time'
import type { History } from './types'

/**
 * Flexible focus streaks ("rhythm").
 *
 * - A day counts as soon as ONE Quality Block is done. The daily goal is an
 *   invitation, never the bar for keeping your rhythm.
 * - Up to GRACE_DAYS quiet days in a row are treated as rest days: they bridge
 *   the rhythm instead of breaking it.
 * - Today never counts against you; it isn't over yet.
 */
export const GRACE_DAYS = 2

export interface Rhythm {
  /** Active days in the current rhythm */
  days: number
  /** Quiet days that were bridged inside the current rhythm */
  restDays: number
  activeToday: boolean
  /** Grace days left before the rhythm resets (only meaningful when days > 0) */
  graceLeft: number
}

export function computeRhythm(history: History, today: string, maxLookback = 730): Rhythm {
  let days = 0
  let restDays = 0
  let gap = 0
  let trailingGap: number | null = null

  for (let i = 0; i < maxLookback; i++) {
    const key = addDays(today, -i)
    const active = (history[key]?.blocks ?? 0) > 0

    if (active) {
      if (trailingGap === null) trailingGap = gap
      days++
      restDays += gap
      gap = 0
      continue
    }

    if (i === 0) continue // today is still unfolding
    gap++
    if (gap > GRACE_DAYS) break
  }

  const activeToday = (history[today]?.blocks ?? 0) > 0
  return {
    days,
    restDays,
    activeToday,
    graceLeft: days === 0 ? GRACE_DAYS : Math.max(0, GRACE_DAYS - (trailingGap ?? 0)),
  }
}

/** The last `count` days, oldest first, for the little week strip. */
export function recentDays(history: History, today: string, count = 7) {
  return Array.from({ length: count }, (_, idx) => {
    const key = addDays(today, idx - (count - 1))
    return { key, blocks: history[key]?.blocks ?? 0, minutes: history[key]?.minutes ?? 0, isToday: key === today }
  })
}

import { describe, expect, it } from 'vitest'
import { computeRhythm, recentDays } from './rhythm'
import { addDays, formatClock } from './time'
import type { History } from './types'

const today = '2026-11-06'
const day = (offset: number) => addDays(today, -offset)
const withBlocks = (...offsets: number[]): History =>
  Object.fromEntries(offsets.map((o) => [day(o), { blocks: 1, minutes: 25 }]))

describe('computeRhythm', () => {
  it('starts at zero with an empty history', () => {
    expect(computeRhythm({}, today)).toMatchObject({ days: 0, restDays: 0, activeToday: false })
  })

  it('counts a day with a single block, regardless of the daily goal', () => {
    expect(computeRhythm(withBlocks(0), today)).toMatchObject({ days: 1, activeToday: true })
  })

  it('does not punish today for not being finished yet', () => {
    expect(computeRhythm(withBlocks(1, 2, 3), today)).toMatchObject({ days: 3, restDays: 0, activeToday: false })
  })

  it('bridges up to two quiet days as rest days', () => {
    // active today, quiet 1 & 2, active 3
    expect(computeRhythm(withBlocks(0, 3), today)).toMatchObject({ days: 2, restDays: 2 })
  })

  it('resets gently after three quiet days in a row', () => {
    expect(computeRhythm(withBlocks(0, 4, 5), today)).toMatchObject({ days: 1, restDays: 0 })
  })

  it('reports how many grace days are left', () => {
    expect(computeRhythm(withBlocks(0), today).graceLeft).toBe(2)
    expect(computeRhythm(withBlocks(1), today).graceLeft).toBe(2)
    expect(computeRhythm(withBlocks(2), today).graceLeft).toBe(1)
    expect(computeRhythm(withBlocks(3), today).graceLeft).toBe(0)
  })

  it('handles month and year boundaries', () => {
    const h: History = { '2026-01-01': { blocks: 2, minutes: 50 }, '2025-12-31': { blocks: 1, minutes: 25 } }
    expect(computeRhythm(h, '2026-01-01')).toMatchObject({ days: 2, restDays: 0 })
  })
})

describe('recentDays', () => {
  it('returns the last seven days, oldest first, ending today', () => {
    const days = recentDays(withBlocks(0), today)
    expect(days).toHaveLength(7)
    expect(days[6]).toMatchObject({ key: today, blocks: 1, isToday: true })
    expect(days[0].key).toBe(day(6))
  })
})

describe('formatClock', () => {
  it('formats minutes and seconds', () => {
    expect(formatClock(25 * 60_000)).toBe('25:00')
    expect(formatClock(1_499_000)).toBe('24:59')
  })
  it('rounds up partial seconds so it never shows 00:00 early', () => {
    expect(formatClock(400)).toBe('00:01')
    expect(formatClock(0)).toBe('00:00')
    expect(formatClock(-50)).toBe('00:00')
  })
})

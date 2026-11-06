export type Mode = 'focus' | 'short' | 'long'
export type TimerStatus = 'idle' | 'running' | 'paused'

export interface Settings {
  focusMinutes: number
  shortMinutes: number
  longMinutes: number
  /** A long rest arrives after this many Quality Blocks */
  longEvery: number
  dailyGoal: number
  autoStartRest: boolean
  autoStartFocus: boolean
  chime: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  focusMinutes: 25,
  shortMinutes: 5,
  longMinutes: 15,
  longEvery: 4,
  dailyGoal: 4,
  autoStartRest: false,
  autoStartFocus: false,
  chime: true,
}

export interface DayRecord {
  /** Quality Blocks completed that day */
  blocks: number
  /** Every focused minute counts, even from blocks that ended early */
  minutes: number
}

/** Keyed by local date, YYYY-MM-DD */
export type History = Record<string, DayRecord>

export const isRest = (mode: Mode) => mode !== 'focus'

export const minutesFor = (mode: Mode, s: Settings) =>
  mode === 'focus' ? s.focusMinutes : mode === 'short' ? s.shortMinutes : s.longMinutes

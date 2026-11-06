import type { Mode, TimerStatus } from './types'

/** Every string a person reads lives here, so the voice stays consistent. */

export const MODE_META: Record<
  Mode,
  { label: string; tab: string; prompts: Record<TimerStatus, string>; start: string }
> = {
  focus: {
    label: 'Deep Focus',
    tab: 'Focus',
    start: 'Begin focusing',
    prompts: {
      idle: 'Protect your focus. One thing at a time.',
      running: 'You’re in it. Let everything else wait.',
      paused: 'Paused. Take all the time you need.',
    },
  },
  short: {
    label: 'Short Rest',
    tab: 'Short rest',
    start: 'Start resting',
    prompts: {
      idle: 'Ready for a quick rest?',
      running: 'Unclench your jaw. Drop your shoulders.',
      paused: 'Rest is still here when you’re ready.',
    },
  },
  long: {
    label: 'Long Rest',
    tab: 'Long rest',
    start: 'Start resting',
    prompts: {
      idle: 'You’ve earned a proper pause.',
      running: 'Stretch, sip some water, look somewhere far away.',
      paused: 'No rush. The rest will wait for you.',
    },
  },
}

export type PendingKind = 'start-focus' | 'start-rest' | 'mode' | 'settings' | 'complete-focus' | 'complete-rest'

export const PREPARING: Record<PendingKind, string[]> = {
  'start-focus': ['Setting up focus mode…', 'Clearing a little space for you…', 'Quieting the noise…'],
  'start-rest': ['Taking a deep breath…', 'Loosening the shoulders…', 'Letting the mind wander…'],
  mode: ['Preparing your calm space…', 'Rearranging the cushions…', 'Finding the right light…'],
  settings: ['Saving your preferences with care…', 'Tucking your settings in…'],
  'complete-focus': ['Lovely work. Taking a deep breath…', 'Wrapping that block up gently…'],
  'complete-rest': ['Welcome back. Warming up your focus…', 'Gathering your attention again…'],
}

export const pick = <T,>(items: readonly T[], random: () => number = Math.random): T =>
  items[Math.floor(random() * items.length)]

/** What the "Today" card says, based on how the day is going. */
export function dayMessage(blocks: number, goal: number): string {
  if (blocks === 0) return 'Your first block is the warmest one. Whenever you’re ready.'
  if (blocks >= goal * 1.5) return 'Above and beyond. Remember that rest is productive too.'
  if (blocks >= goal) return 'You showed up for yourself today.'
  if (blocks === goal - 1) return 'Almost there. Gently does it.'
  if (blocks / goal >= 0.5) return 'Great momentum today.'
  return 'A lovely start. Every block counts.'
}

export function rhythmMessage(days: number, restDays: number, activeToday: boolean): string {
  if (days === 0) return 'Fresh start. Every day is a good day to begin.'
  if (!activeToday && days > 0) return 'Your rhythm is waiting for you. No pressure.'
  if (restDays > 0) return 'Rest days are part of the rhythm, not a break in it.'
  if (days === 1) return 'Today counts. That’s how rhythms begin.'
  return 'You keep coming back. That’s the whole secret.'
}

export const TOASTS = {
  qualityBlock: ['That’s a Quality Block. Lovely work.', 'Block complete. Great momentum today.', 'One more for today. Be proud of that.'],
  closeEnough: ['Close enough counts. That one’s a Quality Block.'],
  effort: ['Ended early, and that’s okay. Your minutes still count.'],
  restDone: ['Rest complete. Welcome back.', 'Feeling a bit lighter? Let’s go gently.'],
  settingsSaved: ['All set. Your space is ready.'],
  newQuote: ['A new quote is waiting for you in your next rest.'],
}

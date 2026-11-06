import type { Mode } from './types'

/** Visual tone per mode. Full class strings so Tailwind can see them. */
export const TONE = {
  focus: {
    hex: '#C86D51',
    text: 'text-terracotta',
    bg: 'bg-terracotta',
    hover: 'hover:bg-terracotta-deep',
    soft: 'bg-terracotta/10',
    ring: 'ring-terracotta/25',
    glow: ['#C86D51', '#E6A15C'],
  },
  rest: {
    hex: '#587B6A',
    text: 'text-sage',
    bg: 'bg-sage',
    hover: 'hover:bg-sage-deep',
    soft: 'bg-sage/10',
    ring: 'ring-sage/25',
    glow: ['#587B6A', '#E6A15C'],
  },
} as const

export const toneFor = (mode: Mode) => (mode === 'focus' ? TONE.focus : TONE.rest)

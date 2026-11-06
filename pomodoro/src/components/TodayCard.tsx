import { motion } from 'framer-motion'
import { Sprout } from 'lucide-react'
import { dayMessage, rhythmMessage } from '../lib/copy'
import { recentDays, type Rhythm } from '../lib/rhythm'
import { weekdayInitial } from '../lib/time'
import type { DayRecord, History } from '../lib/types'

/** Hand-drawn-ish pebble outlines, so no two blocks look machine-identical. */
const PEBBLES = [
  'M20 3c9 0 16 6 16 15s-6 17-16 17S3 28 4 18 11 3 20 3Z',
  'M19 4c10-1 17 7 16 16-1 8-8 15-17 14S4 26 4 18 10 5 19 4Z',
  'M21 3c8 1 15 8 14 17s-8 15-16 15S4 28 4 19 12 2 21 3Z',
  'M18 4c10 0 18 5 18 14 0 10-8 17-17 16S3 27 4 18 9 4 18 4Z',
]

interface Props {
  today: DayRecord
  goal: number
  rhythm: Rhythm
  bestRhythm: number
  history: History
  todayKey: string
}

export function TodayCard({ today, goal, rhythm, bestRhythm, history, todayKey }: Props) {
  const slots = Math.max(goal, today.blocks)
  const week = recentDays(history, todayKey)
  const minutes = Math.round(today.minutes)

  return (
    <section className="card p-6 sm:p-7" aria-labelledby="today-title">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="today-title" className="font-display text-xl text-charcoal">
          Today
        </h2>
        <p className="text-sm text-pebble">
          <span className="font-semibold text-charcoal">{today.blocks}</span> of {goal} Quality Blocks
        </p>
      </div>

      <ul className="mt-5 flex flex-wrap gap-2.5" aria-label={`${today.blocks} of ${goal} Quality Blocks done`}>
        {Array.from({ length: slots }, (_, i) => {
          const filled = i < today.blocks
          const bonus = i >= goal
          return (
            <li key={i}>
              <svg viewBox="0 0 40 38" className="h-9 w-9" aria-hidden style={{ rotate: `${(i * 47) % 30 - 15}deg` }}>
                <motion.path
                  d={PEBBLES[i % PEBBLES.length]}
                  initial={false}
                  animate={{
                    fill: filled ? (bonus ? '#E6A15C' : '#C86D51') : 'rgba(235,229,220,0.5)',
                    scale: filled ? 1 : 0.88,
                  }}
                  style={{ transformOrigin: '20px 19px' }}
                  stroke={filled ? 'none' : '#D9D1C5'}
                  strokeWidth={1.5}
                  strokeDasharray={filled ? undefined : '3 3'}
                  transition={{ type: 'spring', stiffness: 220, damping: 12 }}
                />
              </svg>
            </li>
          )
        })}
      </ul>

      <p className="mt-4 text-[15px] text-charcoal/80">{dayMessage(today.blocks, goal)}</p>
      {minutes > 0 && (
        <p className="mt-1 text-sm text-pebble">
          {minutes} {minutes === 1 ? 'minute' : 'minutes'} of focus today. All of it counts.
        </p>
      )}

      <div className="my-6 h-px bg-sand" />

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-soft/15 text-amber-soft">
            <Sprout className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div>
            <p className="font-display text-lg leading-tight text-charcoal">
              {rhythm.days} {rhythm.days === 1 ? 'day' : 'days'} in rhythm
            </p>
            <p className="text-xs text-pebble">Best so far: {bestRhythm} {bestRhythm === 1 ? 'day' : 'days'}</p>
          </div>
        </div>
        {rhythm.days > 0 && (
          <span className="rounded-full bg-sage/10 px-3 py-1 text-xs font-medium text-sage" title="Quiet days that won't break your rhythm">
            {rhythm.graceLeft} rest {rhythm.graceLeft === 1 ? 'day' : 'days'} in hand
          </span>
        )}
      </div>

      <ol className="mt-5 grid grid-cols-7 gap-1.5" aria-label="The last seven days">
        {week.map((d) => {
          const fill = Math.min(1, d.blocks / goal)
          return (
            <li key={d.key} className="flex flex-col items-center gap-1.5">
              <span
                className={`relative grid h-7 w-7 place-items-center sm:h-8 sm:w-8 rounded-[45%_55%_50%_50%/55%_45%_55%_45%] ${
                  d.isToday ? 'ring-2 ring-terracotta/30 ring-offset-2 ring-offset-ivory' : ''
                }`}
                style={{ backgroundColor: d.blocks > 0 ? `rgba(200,109,81,${0.18 + fill * 0.72})` : '#F1ECE4' }}
                title={`${d.key}: ${d.blocks} ${d.blocks === 1 ? 'block' : 'blocks'}`}
              >
                <span className="sr-only">
                  {d.key}: {d.blocks} blocks
                </span>
              </span>
              <span className={`text-[11px] ${d.isToday ? 'font-semibold text-charcoal' : 'text-pebble'}`}>
                {weekdayInitial(d.key)}
              </span>
            </li>
          )
        })}
      </ol>

      <p className="mt-4 text-sm text-pebble">{rhythmMessage(rhythm.days, rhythm.restDays, rhythm.activeToday)}</p>
    </section>
  )
}

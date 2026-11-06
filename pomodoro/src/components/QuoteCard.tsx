import { AnimatePresence, motion } from 'framer-motion'
import { Feather, Lock, Shuffle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { QUOTES } from '../lib/quotes'

interface Props {
  /** True only while a rest timer is underway: quotes are a break-time reward */
  revealed: boolean
  /** True in a rest mode that hasn't started yet */
  restReady: boolean
  unlocked: number
  seenUpTo: number
  onSeen: (index: number) => void
}

const ease = [0.32, 0.72, 0, 1] as const

export function QuoteCard({ revealed, restReady, unlocked, seenUpTo, onSeen }: Props) {
  const collected = Math.min(unlocked, QUOTES.length)

  return (
    <section className="card relative overflow-hidden p-6 sm:p-7" aria-labelledby="quote-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="quote-title" className="flex items-center gap-2 font-display text-xl text-charcoal">
          <Feather className="h-[18px] w-[18px] text-amber-soft" strokeWidth={1.8} />
          Rest notes
        </h2>
        <span className="text-xs text-pebble">
          {collected} of {QUOTES.length} collected
        </span>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {revealed ? (
          // Mounting = a rest has begun, which is when a quote gets chosen
          <RevealedQuote key="revealed" unlocked={collected} seenUpTo={seenUpTo} onSeen={onSeen} />
        ) : (
          <motion.div
            key="locked"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-5 flex items-start gap-4"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-clay text-pebble">
              <Lock className="h-[18px] w-[18px]" strokeWidth={1.8} />
            </span>
            <div>
              <p className="text-[15px] text-charcoal/80">
                {restReady
                  ? 'Start your rest and a quote will be waiting for you.'
                  : 'Quotes appear only during your rests, a little reward for stepping away.'}
              </p>
              <p className="mt-1 text-sm text-pebble">
                {collected < QUOTES.length
                  ? 'Each Quality Block unlocks a new one.'
                  : 'You’ve collected every quote. Wonderful.'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-sand/70" aria-hidden>
        <motion.div
          className="h-full rounded-full bg-amber-soft"
          initial={false}
          animate={{ width: `${(collected / QUOTES.length) * 100}%` }}
          transition={{ type: 'spring', stiffness: 60, damping: 16 }}
        />
      </div>
    </section>
  )
}

function RevealedQuote({ unlocked, seenUpTo, onSeen }: { unlocked: number; seenUpTo: number; onSeen: (i: number) => void }) {
  // Newest unseen quote first; otherwise a gentle shuffle through the collection
  const [shown, setShown] = useState(() => {
    const newest = unlocked - 1
    return newest > seenUpTo ? { index: newest, isNew: true } : { index: randomIndex(unlocked), isNew: false }
  })

  useEffect(() => {
    if (shown.isNew) onSeen(shown.index)
  }, [shown, onSeen])

  const another = () => setShown((s) => ({ index: randomIndex(unlocked, s.index), isNew: false }))
  const quote = QUOTES[shown.index]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(6px)' }}
      transition={{ duration: 0.6, ease }}
      className="mt-5"
    >
      <AnimatePresence mode="wait" initial={true}>
        <motion.figure
          key={shown.index}
          initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -6, filter: 'blur(6px)' }}
          transition={{ duration: 0.8, ease }}
        >
          {shown.isNew && (
            <span className="mb-3 inline-block rounded-full bg-amber-soft/15 px-2.5 py-1 text-xs font-semibold text-amber-deep">
              New for you
            </span>
          )}
          <blockquote className="font-display text-xl leading-snug text-charcoal sm:text-[1.35rem]">
            “{quote.text}”
          </blockquote>
          <figcaption className="mt-4 flex items-center justify-between gap-3 text-sm text-pebble">
            <span>
              <span className="font-medium text-charcoal/80">{quote.author}</span>
              {quote.source && <span className="italic">, {quote.source}</span>}
            </span>
            {unlocked > 1 && (
              <button
                type="button"
                onClick={another}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-sage transition-colors hover:bg-sage/10"
              >
                <Shuffle className="h-3.5 w-3.5" /> Another
              </button>
            )}
          </figcaption>
        </motion.figure>
      </AnimatePresence>
    </motion.div>
  )
}

function randomIndex(count: number, avoid?: number): number {
  if (count <= 1) return 0
  let i = Math.floor(Math.random() * count)
  if (i === avoid) i = (i + 1 + Math.floor(Math.random() * (count - 1))) % count
  return i
}

import { motion } from 'framer-motion'
import { CloudRain, Flame, Waves, type LucideIcon } from 'lucide-react'
import type { SoundId } from '../lib/audio/engine'

const SOUNDS: { id: SoundId; name: string; hint: string; icon: LucideIcon }[] = [
  { id: 'rain', name: 'Soft rain', hint: 'On a window, far away', icon: CloudRain },
  { id: 'fire', name: 'Fireplace', hint: 'Low crackle, slow warmth', icon: Flame },
  { id: 'noise', name: 'Warm noise', hint: 'A deep, steady hush', icon: Waves },
]

interface Props {
  supported: boolean
  volumes: Record<SoundId, number>
  playing: Record<SoundId, boolean>
  onToggle: (id: SoundId) => void
  onVolume: (id: SoundId, value: number) => void
}

export function Soundscape({ supported, volumes, playing, onToggle, onVolume }: Props) {
  const anyPlaying = Object.values(playing).some(Boolean)
  return (
    <section className="card p-6 sm:p-7" aria-labelledby="sound-title">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="sound-title" className="font-display text-xl text-charcoal">
          Soundscape
        </h2>
        <span className="hidden text-xs text-pebble min-[380px]:inline">{anyPlaying ? 'Playing softly' : 'Mix as many as you like'}</span>
      </div>

      {!supported ? (
        <p className="mt-4 text-sm text-pebble">This browser can’t make sounds for us, but the quiet is lovely too.</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {SOUNDS.map(({ id, name, hint, icon: Icon }) => {
            const on = playing[id]
            const volume = volumes[id]
            return (
              <li
                key={id}
                className={`rounded-2xl border p-3 transition-colors duration-500 ${
                  on ? 'border-sage/25 bg-sage/[0.06]' : 'border-sand bg-ivory'
                }`}
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <motion.button
                    type="button"
                    onClick={() => onToggle(id)}
                    aria-pressed={on}
                    aria-label={`${on ? 'Stop' : 'Play'} ${name.toLowerCase()}`}
                    whileTap={{ scale: 0.92 }}
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl transition-colors duration-500 ${
                      on ? 'bg-sage text-ivory' : 'bg-clay text-charcoal/70 hover:text-charcoal'
                    }`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </motion.button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[15px] font-medium text-charcoal">{name}</p>
                      {on && <Equalizer />}
                    </div>
                    <p className="truncate text-xs text-pebble">{hint}</p>
                  </div>
                  <label className="flex w-full items-center pl-14 min-[440px]:w-32 min-[440px]:pl-0">
                    <span className="sr-only">{name} volume</span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={volume}
                      onChange={(e) => onVolume(id, Number(e.target.value))}
                      className="soft-range"
                      style={{ ['--range-fill' as string]: `${volume * 100}%`, ['--range-color' as string]: on ? '#587B6A' : '#B8AFA4' }}
                    />
                  </label>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function Equalizer() {
  return (
    <span className="flex h-3 items-end gap-[2px]" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-sage"
          animate={{ height: ['30%', '100%', '45%', '80%', '30%'] }}
          transition={{ duration: 1.8 + i * 0.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </span>
  )
}

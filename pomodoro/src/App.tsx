import { MotionConfig } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AmbientGlow } from './components/AmbientGlow'
import { Header } from './components/Header'
import { QuoteCard } from './components/QuoteCard'
import { SettingsSheet } from './components/SettingsSheet'
import { Soundscape } from './components/Soundscape'
import { TimerCard } from './components/TimerCard'
import { Toast } from './components/Toast'
import { TodayCard } from './components/TodayCard'
import { WatercolorBloom } from './components/WatercolorBloom'
import { useAmbient } from './hooks/useAmbient'
import { useDocumentTitle } from './hooks/useDocumentTitle'
import { usePersistentState } from './hooks/usePersistentState'
import { usePomodoro, type FocusSettled } from './hooks/usePomodoro'
import { useProgress } from './hooks/useProgress'
import { useToday } from './hooks/useToday'
import { soundEngine } from './lib/audio/engine'
import { MODE_META, TOASTS, pick } from './lib/copy'
import { formatClock } from './lib/time'
import { DEFAULT_SETTINGS, isRest, type Settings } from './lib/types'

export default function App() {
  const [settings, setSettings] = usePersistentState<Settings>('settings', DEFAULT_SETTINGS)
  const [intention, setIntention] = usePersistentState('intention', '')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [bloom, setBloom] = useState(false)
  const [toast, showToast] = useToast()

  const today = useToday()
  const progress = useProgress(today, settings.dailyGoal)
  const ambient = useAmbient()

  const { record } = progress
  const onFocusSettled = useCallback(
    ({ focusedMs, isBlock, completed }: FocusSettled) => {
      const result = record(focusedMs, isBlock)
      if (result.reachedGoal) {
        setBloom(true)
        return
      }
      if (isBlock) showToast(pick(completed ? TOASTS.qualityBlock : TOASTS.closeEnough))
      else showToast(pick(TOASTS.effort))
    },
    [record, showToast],
  )

  const timer = usePomodoro({
    settings,
    onFocusSettled,
    onSessionEnd: () => {
      if (settings.chime) soundEngine.chime()
    },
    onRestEnd: () => showToast(pick(TOASTS.restDone)),
    onGesture: () => soundEngine.unlock(),
  })

  // "24:59 - Deep Focus" in the tab, so a glance is all it takes
  const label = MODE_META[timer.mode].label
  const clock = formatClock(timer.remainingMs)
  useDocumentTitle(
    timer.pending
      ? timer.pending.message
      : timer.status === 'running'
        ? `${clock} - ${label}`
        : timer.status === 'paused'
          ? `Paused · ${clock} - ${label}`
          : 'Hearth · Ready when you are',
  )

  // Space bar starts and pauses, unless you're typing
  const { status, start, pause } = timer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat || settingsOpen || bloom) return
      const el = e.target as HTMLElement | null
      if (el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(el.tagName))) return
      e.preventDefault()
      if (status === 'running') pause()
      else start()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [status, start, pause, settingsOpen, bloom])

  const saveSettings = useCallback(
    (next: Settings) => {
      setSettings(next)
      setSettingsOpen(false)
      showToast(pick(TOASTS.settingsSaved))
    },
    [setSettings, showToast],
  )

  const closeSettings = useCallback(() => setSettingsOpen(false), [])
  const closeBloom = useCallback(() => setBloom(false), [])

  const rest = isRest(timer.mode)
  const restUnderway = rest && timer.status !== 'idle' && !timer.pending

  return (
    <MotionConfig reducedMotion="user">
      <div className="grain relative min-h-dvh overflow-x-hidden">
        <AmbientGlow mode={timer.mode} />

        <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
          <Header onOpenSettings={() => setSettingsOpen(true)} />

          <main className="mt-8 grid grid-cols-1 items-start gap-6 lg:mt-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <TimerCard
              mode={timer.mode}
              status={timer.status}
              remainingMs={timer.remainingMs}
              durationMs={timer.durationMs}
              endAt={timer.endAt}
              progress={timer.progress}
              cycle={timer.cycle}
              longEvery={settings.longEvery}
              pending={timer.pending}
              intention={intention}
              onIntention={setIntention}
              onStart={timer.start}
              onPause={timer.pause}
              onReset={timer.reset}
              onSkip={timer.skip}
              onMode={timer.switchMode}
            />

            <div className="flex flex-col gap-6">
              <TodayCard
                today={progress.today}
                goal={settings.dailyGoal}
                rhythm={progress.rhythm}
                bestRhythm={progress.bestRhythm}
                history={progress.history}
                todayKey={today}
              />
              <QuoteCard
                revealed={restUnderway}
                restReady={rest && timer.status === 'idle'}
                unlocked={progress.unlocked}
                seenUpTo={progress.seenUpTo}
                onSeen={progress.markSeen}
              />
              <Soundscape
                supported={ambient.supported}
                volumes={ambient.volumes}
                playing={ambient.playing}
                onToggle={ambient.toggle}
                onVolume={ambient.setVolume}
              />
            </div>
          </main>

          <footer className="mt-10 pb-4 text-center text-xs text-pebble">
            Your progress stays on this device.{' '}
            <span className="pointer-coarse:hidden">
              Press <kbd className="rounded bg-sand/70 px-1.5 py-0.5 font-sans">Space</kbd> to start or pause.{' '}
            </span>
            Be kind to yourself.
          </footer>
        </div>

        <SettingsSheet open={settingsOpen} settings={settings} onClose={closeSettings} onSave={saveSettings} />
        <WatercolorBloom open={bloom} goal={settings.dailyGoal} onClose={closeBloom} />
        <Toast message={toast} />
      </div>
    </MotionConfig>
  )
}

function useToast(): [string | null, (message: string) => void] {
  const [message, setMessage] = useState<string | null>(null)
  const timeout = useRef<number | undefined>(undefined)
  const show = useCallback((next: string) => {
    window.clearTimeout(timeout.current)
    setMessage(next)
    timeout.current = window.setTimeout(() => setMessage(null), 4200)
  }, [])
  return [message, show]
}

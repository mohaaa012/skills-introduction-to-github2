import { useCallback, useEffect, useState } from 'react'
import { soundEngine, type SoundId } from '../lib/audio/engine'
import { usePersistentState } from './usePersistentState'

const DEFAULT_VOLUMES: Record<SoundId, number> = { rain: 0.55, fire: 0.5, noise: 0.35 }
const SILENT: Record<SoundId, boolean> = { rain: false, fire: false, noise: false }

export function useAmbient() {
  const [volumes, setVolumes] = usePersistentState('sound-volumes', DEFAULT_VOLUMES)
  // Playback is never restored on load: sound should only begin because you asked for it.
  const [playing, setPlaying] = useState(SILENT)

  const toggle = useCallback(
    (id: SoundId) => {
      if (soundEngine.isPlaying(id)) soundEngine.stop(id)
      else soundEngine.play(id, volumes[id])
      setPlaying((p) => ({ ...p, [id]: soundEngine.isPlaying(id) }))
    },
    [volumes],
  )

  const setVolume = useCallback(
    (id: SoundId, value: number) => {
      setVolumes((v) => ({ ...v, [id]: value }))
      soundEngine.setVolume(id, value)
    },
    [setVolumes],
  )

  const stopAll = useCallback(() => {
    for (const id of Object.keys(SILENT) as SoundId[]) soundEngine.stop(id)
    setPlaying(SILENT)
  }, [])

  useEffect(() => stopAll, [stopAll])

  return { supported: soundEngine.supported, volumes, playing, toggle, setVolume, stopAll }
}

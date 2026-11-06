/**
 * Ambient soundscapes synthesised entirely with the Web Audio API.
 * No audio files: each sound is a procedurally generated, seamlessly looping
 * buffer shaped by a couple of filters. Everything fades in and out slowly.
 */

export type SoundId = 'rain' | 'fire' | 'noise'

interface Recipe {
  seconds: number
  build: (out: Float32Array, sampleRate: number) => void
  filters: (ctx: AudioContext) => AudioNode[]
  /** Loudness trim so all layers feel equal at the same slider position */
  trim: number
}

const FADE_IN_S = 0.6 // time constant: ~95% after ~1.8 s
const FADE_OUT_S = 0.35
const LOOP_CROSSFADE_S = 0.5

// ── Noise colours ────────────────────────────────────────────────────────────

function pinkNoise(out: Float32Array) {
  // Paul Kellet's economy pink filter
  let b0 = 0, b1 = 0, b2 = 0
  for (let i = 0; i < out.length; i++) {
    const white = Math.random() * 2 - 1
    b0 = 0.99765 * b0 + white * 0.099046
    b1 = 0.963 * b1 + white * 0.2965164
    b2 = 0.57 * b2 + white * 1.0526913
    out[i] = (b0 + b1 + b2 + white * 0.1848) * 0.11
  }
}

function brownNoise(out: Float32Array, gain = 3.5) {
  let last = 0
  for (let i = 0; i < out.length; i++) {
    const white = Math.random() * 2 - 1
    last = (last + 0.02 * white) / 1.02
    out[i] = last * gain
  }
}

/** A slowly wandering 0..1 envelope, for breath-like swells */
function wander(length: number, sampleRate: number, speed = 0.25): Float32Array {
  const env = new Float32Array(length)
  let value = 0.5
  let target = 0.5
  const step = Math.floor(sampleRate / speed)
  for (let i = 0; i < length; i++) {
    if (i % step === 0) target = 0.25 + Math.random() * 0.75
    value += (target - value) * (1 / sampleRate) * 1.5
    env[i] = value
  }
  return env
}

/** Short decaying noise burst added at `start` */
function addBurst(out: Float32Array, start: number, amp: number, decaySamples: number) {
  const end = Math.min(out.length, start + decaySamples * 6)
  for (let i = start; i < end; i++) {
    out[i] += (Math.random() * 2 - 1) * amp * Math.exp(-(i - start) / decaySamples)
  }
}

// ── Recipes ──────────────────────────────────────────────────────────────────

const RECIPES: Record<SoundId, Recipe> = {
  rain: {
    seconds: 12,
    trim: 0.9,
    build(out, sr) {
      pinkNoise(out)
      const swell = wander(out.length, sr, 0.15)
      for (let i = 0; i < out.length; i++) out[i] *= 0.65 + swell[i] * 0.35
      // Droplets: many tiny ticks, a few closer, softer ones
      const drops = Math.floor(out.length / sr) * 55
      for (let d = 0; d < drops; d++) {
        const near = Math.random() < 0.08
        addBurst(out, Math.floor(Math.random() * out.length), near ? 0.22 : 0.06 + Math.random() * 0.06, sr * (near ? 0.004 : 0.0015))
      }
    },
    filters(ctx) {
      const hp = ctx.createBiquadFilter()
      hp.type = 'highpass'
      hp.frequency.value = 350
      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 6500
      lp.Q.value = 0.4
      return [hp, lp]
    },
  },

  fire: {
    seconds: 14,
    trim: 1.1,
    build(out, sr) {
      // Low rumble that flickers
      brownNoise(out, 3)
      const flicker = wander(out.length, sr, 0.6)
      for (let i = 0; i < out.length; i++) out[i] *= 0.45 + flicker[i] * 0.55
      // Crackles arrive in little clusters, plus the odd satisfying pop
      let t = 0
      while (t < out.length) {
        t += Math.floor(sr * (0.05 + Math.random() * 0.45))
        const cluster = 1 + Math.floor(Math.random() * 4)
        for (let c = 0; c < cluster && t < out.length; c++) {
          addBurst(out, t, 0.12 + Math.random() * 0.3, sr * (0.0004 + Math.random() * 0.0012))
          t += Math.floor(sr * (0.004 + Math.random() * 0.03))
        }
        if (Math.random() < 0.06) addBurst(out, t, 0.55, sr * 0.003)
      }
    },
    filters(ctx) {
      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 4200
      const warmth = ctx.createBiquadFilter()
      warmth.type = 'lowshelf'
      warmth.frequency.value = 220
      warmth.gain.value = 4
      return [lp, warmth]
    },
  },

  noise: {
    seconds: 10,
    trim: 1,
    build(out, sr) {
      brownNoise(out)
      const swell = wander(out.length, sr, 0.08)
      for (let i = 0; i < out.length; i++) out[i] *= 0.8 + swell[i] * 0.2
    },
    filters(ctx) {
      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 900
      lp.Q.value = 0.3
      return [lp]
    },
  },
}

// ── Engine ───────────────────────────────────────────────────────────────────

interface Layer {
  source: AudioBufferSourceNode
  gain: GainNode
}

class SoundEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private buffers = new Map<SoundId, AudioBuffer>()
  private layers = new Map<SoundId, Layer>()

  get supported(): boolean {
    return typeof window !== 'undefined' && ('AudioContext' in window || 'webkitAudioContext' in window)
  }

  /** Must be called from a user gesture the first time (browser autoplay rules). */
  unlock(): AudioContext | null {
    if (!this.supported) return null
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new Ctor()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.9
      this.master.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    return this.ctx
  }

  private buffer(id: SoundId, ctx: AudioContext): AudioBuffer {
    const cached = this.buffers.get(id)
    if (cached) return cached
    const recipe = RECIPES[id]
    const sr = ctx.sampleRate
    const length = Math.floor(recipe.seconds * sr)
    const fade = Math.floor(LOOP_CROSSFADE_S * sr)
    const raw = new Float32Array(length + fade)
    recipe.build(raw, sr)

    // Crossfade the tail into the head so the loop point is inaudible
    const buf = ctx.createBuffer(1, length, sr)
    const data = buf.getChannelData(0)
    for (let i = 0; i < length; i++) data[i] = raw[i]
    for (let i = 0; i < fade; i++) {
      const k = i / fade
      data[i] = raw[i] * Math.sqrt(k) + raw[length + i] * Math.sqrt(1 - k)
    }
    // Normalise to a gentle peak
    let peak = 0
    for (let i = 0; i < length; i++) peak = Math.max(peak, Math.abs(data[i]))
    if (peak > 0) for (let i = 0; i < length; i++) data[i] *= 0.8 / peak

    this.buffers.set(id, buf)
    return buf
  }

  isPlaying(id: SoundId): boolean {
    return this.layers.has(id)
  }

  play(id: SoundId, volume: number) {
    const ctx = this.unlock()
    if (!ctx || !this.master || this.layers.has(id)) return
    const source = ctx.createBufferSource()
    source.buffer = this.buffer(id, ctx)
    source.loop = true
    const gain = ctx.createGain()
    gain.gain.value = 0
    const chain = [source, ...RECIPES[id].filters(ctx), gain]
    for (let i = 0; i < chain.length - 1; i++) chain[i].connect(chain[i + 1])
    gain.connect(this.master)
    source.start()
    gain.gain.setTargetAtTime(this.level(id, volume), ctx.currentTime, FADE_IN_S)
    this.layers.set(id, { source, gain })
  }

  stop(id: SoundId) {
    const layer = this.layers.get(id)
    if (!layer || !this.ctx) return
    this.layers.delete(id)
    const now = this.ctx.currentTime
    layer.gain.gain.cancelScheduledValues(now)
    layer.gain.gain.setTargetAtTime(0, now, FADE_OUT_S)
    layer.source.stop(now + FADE_OUT_S * 6)
  }

  setVolume(id: SoundId, volume: number) {
    const layer = this.layers.get(id)
    if (!layer || !this.ctx) return
    layer.gain.gain.setTargetAtTime(this.level(id, volume), this.ctx.currentTime, 0.12)
  }

  /** Perceptual curve: sliders feel linear to the ear */
  private level(id: SoundId, volume: number) {
    const v = Math.min(1, Math.max(0, volume))
    return v * v * RECIPES[id].trim
  }

  /** A soft, two-note bowl-like chime. Never a beep. */
  chime() {
    const ctx = this.unlock()
    if (!ctx || ctx.state !== 'running') return
    const out = ctx.createGain()
    out.gain.value = 0.16
    out.connect(ctx.destination)
    const note = (freq: number, at: number, level: number) => {
      // A fundamental plus slightly detuned partials gives a warm, bowl-like shimmer
      for (const [ratio, amp] of [[1, 1], [2.01, 0.32], [3.02, 0.12]] as const) {
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.value = freq * ratio
        const g = ctx.createGain()
        const t0 = ctx.currentTime + at
        g.gain.setValueAtTime(0, t0)
        g.gain.linearRampToValueAtTime(level * amp, t0 + 0.06)
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.4)
        osc.connect(g).connect(out)
        osc.start(t0)
        osc.stop(t0 + 3.6)
      }
    }
    note(392.0, 0, 0.9) // G4
    note(587.33, 0.42, 0.6) // D5
  }
}

export const soundEngine = new SoundEngine()

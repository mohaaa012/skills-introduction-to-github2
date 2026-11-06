import { motion, useAnimationFrame, useReducedMotion } from 'framer-motion'
import { useLayoutEffect, useMemo, useRef } from 'react'

const SIZE = 320
const C = SIZE / 2
const R = 134
const POINTS = 90

type Point = [number, number]

/**
 * A closed, gently wobbling loop. Radius is a sum of slow sine harmonics so the
 * shape is never a perfect (robotic) circle and drifts like something alive.
 * It starts at 12 o'clock so stroke progress grows clockwise from the top.
 */
function blobPoints(t: number, amp: number, radius: number, seed: number): Point[] {
  const pts: Point[] = []
  for (let i = 0; i < POINTS; i++) {
    const a = -Math.PI / 2 + (i / POINTS) * Math.PI * 2
    const wobble =
      2.6 * Math.sin(3 * a + t * 0.38 + seed) +
      1.7 * Math.sin(5 * a - t * 0.29 + seed * 1.7) +
      0.9 * Math.sin(2 * a + t * 0.21 + seed * 0.6)
    const r = radius + amp * wobble
    pts.push([C + r * Math.cos(a), C + r * Math.sin(a)])
  }
  return pts
}

/** Catmull-Rom → cubic Bézier, ending exactly where it began (no Z, so dashes start at the top). */
function smoothPath(pts: Point[]): string {
  const n = pts.length
  const f = (v: number) => v.toFixed(2)
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]
    const p1 = pts[i]
    const p2 = pts[(i + 1) % n]
    const p3 = pts[(i + 2) % n]
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += `C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(p2[0])} ${f(p2[1])}`
  }
  return d
}

const blob = (t: number, amp: number, radius = R, seed = 0) => smoothPath(blobPoints(t, amp, radius, seed))

interface Props {
  color: string
  /** 0..1, used when the clock isn't running */
  progress: number
  running: boolean
  endAt: number | null
  durationMs: number
  /** Rest mode: the inner shape breathes slowly in and out */
  breathing: boolean
  label: string
}

export function OrganicRing({ color, progress, running, endAt, durationMs, breathing, label }: Props) {
  const reduceMotion = useReducedMotion()
  const trackRef = useRef<SVGPathElement>(null)
  const strokeRef = useRef<SVGPathElement>(null)
  const innerRef = useRef<SVGPathElement>(null)
  const headRef = useRef<SVGGElement>(null)
  const amp = useRef(0.55)
  const live = useRef({ progress, running, endAt, durationMs })
  useLayoutEffect(() => {
    live.current = { progress, running, endAt, durationMs }
  }, [progress, running, endAt, durationMs])

  const initial = useMemo(() => ({ ring: blob(0, 0.55), inner: blob(0, 0.8, R - 26, 2.4) }), [])

  useAnimationFrame((ms) => {
    const { running, endAt, durationMs, progress } = live.current
    const t = reduceMotion ? 0 : ms / 1000
    // Ease the wobble up while running, down when idle — never a hard switch
    amp.current += ((running ? 1 : 0.55) - amp.current) * 0.04

    const ring = blob(t, amp.current)
    trackRef.current?.setAttribute('d', ring)
    const stroke = strokeRef.current
    if (stroke) {
      stroke.setAttribute('d', ring)
      const p =
        running && endAt != null && durationMs > 0
          ? Math.min(1, Math.max(0, 1 - (endAt - Date.now()) / durationMs))
          : progress
      stroke.style.strokeDashoffset = String(1 - p)
      stroke.style.opacity = p < 0.003 ? '0' : '1'
      const total = stroke.getTotalLength()
      const pt = stroke.getPointAtLength(total * p)
      headRef.current?.setAttribute('transform', `translate(${pt.x.toFixed(2)} ${pt.y.toFixed(2)})`)
    }
    innerRef.current?.setAttribute('d', blob(t * 0.7, 0.8, R - 26, 2.4))
  })

  const breathe = !reduceMotion && running
  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full overflow-visible" role="img" aria-label={label}>
      <defs>
        <filter id="ring-soft-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {/* Inner breathing shape */}
      <motion.g
        style={{ transformOrigin: `${C}px ${C}px` }}
        animate={
          breathe
            ? { scale: breathing ? [0.9, 1.04, 0.9] : [0.97, 1.0, 0.97] }
            : { scale: 0.96 }
        }
        transition={
          breathe
            ? { duration: breathing ? 8 : 6, repeat: Infinity, ease: 'easeInOut' }
            : { type: 'spring', stiffness: 40, damping: 14 }
        }
      >
        <path
          ref={innerRef}
          d={initial.inner}
          style={{ fill: color, fillOpacity: running ? 0.08 : 0.05, transition: 'fill 1.2s ease, fill-opacity 1.2s ease' }}
        />
      </motion.g>

      {/* Track */}
      <path ref={trackRef} d={initial.ring} fill="none" stroke="#EBE5DC" strokeWidth={10} strokeLinecap="round" />

      {/* Progress. Plain <path>: the dash offset is driven per frame above. */}
      <path
        ref={strokeRef}
        d={initial.ring}
        fill="none"
        strokeWidth={12}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={1}
        opacity={0}
        style={{ stroke: color, transition: 'stroke 1.2s ease, opacity 0.6s ease' }}
      />

      {/* Progress head: a small pebble that travels the ring */}
      <g ref={headRef} transform={`translate(${C} ${C - R})`}>
        <motion.circle
          r={11}
          initial={false}
          animate={{ fill: color, opacity: running ? 0.35 : 0.18 }}
          filter="url(#ring-soft-glow)"
        />
        <motion.circle
          r={7.5}
          fill="#FFFFFF"
          strokeWidth={3.5}
          initial={false}
          animate={{ stroke: color, scale: running ? 1 : 0.85 }}
          transition={{ type: 'spring', stiffness: 160, damping: 14 }}
        />
      </g>
    </svg>
  )
}

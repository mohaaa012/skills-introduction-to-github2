/**
 * "Zero Robot Effect": a short, human-feeling pause before things happen.
 * Instant state flips feel mechanical; a breath of 1.2–1.8 s feels considered.
 */
export const LATENCY_MIN_MS = 1200
export const LATENCY_MAX_MS = 1800

export function organicDelayMs(random: () => number = Math.random): number {
  return Math.round(LATENCY_MIN_MS + random() * (LATENCY_MAX_MS - LATENCY_MIN_MS))
}

export function organicPause(ms = organicDelayMs()): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

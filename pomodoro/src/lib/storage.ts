const PREFIX = 'hearth:'

/** localStorage can throw (private mode, quota, blocked cookies) — never let that break the app. */
export function load<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    if (raw == null) return fallback
    const parsed = JSON.parse(raw) as T
    // Merge plain objects so new fields added in later versions get their defaults
    if (isPlainObject(fallback) && isPlainObject(parsed)) return { ...fallback, ...parsed }
    return parsed
  } catch {
    return fallback
  }
}

export function save<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* storage unavailable: the app keeps working, it just won't remember */
  }
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

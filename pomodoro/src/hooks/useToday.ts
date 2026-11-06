import { useEffect, useState } from 'react'
import { dateKey } from '../lib/time'

/** The local date, kept fresh so a session that runs past midnight lands on the right day. */
export function useToday(): string {
  const [today, setToday] = useState(() => dateKey())
  useEffect(() => {
    const id = window.setInterval(() => setToday(dateKey()), 30_000)
    return () => window.clearInterval(id)
  }, [])
  return today
}

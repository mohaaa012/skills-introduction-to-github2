import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { load, save } from '../lib/storage'

/** useState that quietly remembers itself in localStorage. */
export function usePersistentState<T>(key: string, initial: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    const fallback = typeof initial === 'function' ? (initial as () => T)() : initial
    return load(key, fallback)
  })

  useEffect(() => {
    save(key, value)
  }, [key, value])

  return [value, setValue]
}

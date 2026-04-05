import { useEffect, useRef } from 'react'

/**
 * Debounced auto-save hook.
 * Calls `onSave` after `delay` ms of inactivity since last change.
 */
export function useAutoSave(value, onSave, delay = 2000) {
  const timerRef = useRef(null)
  const prevValue = useRef(value)

  useEffect(() => {
    if (value === prevValue.current) return
    prevValue.current = value

    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      onSave?.(value)
    }, delay)

    return () => clearTimeout(timerRef.current)
  }, [value, onSave, delay])
}

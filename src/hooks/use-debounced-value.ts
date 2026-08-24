"use client"

import { useEffect, useState } from "react"

/**
 * Debounces a value without delaying the first render.
 *
 * Pages used to wrap the whole fetch in a `setTimeout` to avoid hammering the
 * server while the user types, which also delayed the very first load of the
 * module. Debouncing only the search term keeps typing cheap while mount,
 * pagination and filter changes fetch immediately.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    if (Object.is(debouncedValue, value)) return

    const timeout = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timeout)
  }, [value, delay, debouncedValue])

  return debouncedValue
}

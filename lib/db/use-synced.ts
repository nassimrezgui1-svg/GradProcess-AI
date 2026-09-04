"use client"

import { useEffect, useRef, useState } from "react"
import { DATA_SYNCED_EVENT } from "./local"

/**
 * Reads from the local cache on mount and again every time a cloud sync
 * finishes, so a page opened before the account's history arrives updates
 * itself instead of showing an empty state.
 *
 * `read` may be an inline closure — only the latest one is ever called.
 */
export function useSyncedRead<T>(read: () => T, initial: T): T {
  const [value, setValue] = useState<T>(initial)
  const readRef = useRef(read)
  readRef.current = read

  useEffect(() => {
    const refresh = () => setValue(readRef.current())
    refresh()
    window.addEventListener(DATA_SYNCED_EVENT, refresh)
    return () => window.removeEventListener(DATA_SYNCED_EVENT, refresh)
  }, [])

  return value
}

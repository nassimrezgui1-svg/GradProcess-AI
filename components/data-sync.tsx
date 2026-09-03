"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { syncNow } from "@/lib/db/sync"

/**
 * Mounted once inside the app shell. Pulls the signed-in account's history into
 * the local cache on load, again whenever the auth state changes, and when the
 * tab regains focus so a second device's work shows up without a reload.
 */
export function DataSync() {
  useEffect(() => {
    void syncNow()

    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
        void syncNow()
      }
    })

    const onFocus = () => {
      if (document.visibilityState === "visible") void syncNow()
    }
    document.addEventListener("visibilitychange", onFocus)

    return () => {
      subscription.unsubscribe()
      document.removeEventListener("visibilitychange", onFocus)
    }
  }, [])

  return null
}

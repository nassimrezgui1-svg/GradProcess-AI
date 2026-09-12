// User-namespaced browser storage.
//
// Every store in the app reads synchronously so pages render without a loading
// pass. That stays true — but the cache is now keyed per account, so signing in
// as someone else on a shared browser can never surface the previous user's
// work. The cloud sync layer (lib/db/sync.ts) keeps these keys hydrated.

const LEGACY_KEYS = [
  "gradprocess_scores",
  "gradprocess_psych_log",
  "gradprocess_gamification",
  "gradprocess_tracker",
  "gradprocess_profile",
  "gradprocess_interview_sessions",
] as const

export type LegacyKey = (typeof LEGACY_KEYS)[number]

const OWNER_KEY = "gradprocess_active_user"

/** The account whose data the cache currently holds, or "anon" before sign-in. */
export function activeUser(): string {
  if (typeof window === "undefined") return "anon"
  return localStorage.getItem(OWNER_KEY) || "anon"
}

export function setActiveUser(userId: string | null) {
  if (typeof window === "undefined") return
  const next = userId || "anon"
  if (localStorage.getItem(OWNER_KEY) === next) return
  localStorage.setItem(OWNER_KEY, next)
}

function scoped(key: string, userId = activeUser()): string {
  return `${key}::${userId}`
}

export function readLocal<T>(key: LegacyKey, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(scoped(key))
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeLocal(key: LegacyKey, value: unknown, userId = activeUser()) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(scoped(key, userId), JSON.stringify(value))
  } catch {
    // Quota exceeded or storage disabled — the cloud copy is authoritative.
  }
}

/**
 * Discards data written at the unscoped key, from before storage was keyed by
 * account.
 *
 * This used to *claim* that data for the first account to sign in on the
 * browser. That handed one person's work to whoever signed up next: a fresh
 * account opened on a machine where anyone had used the app inherited their
 * scores, showed them on the dashboard, and uploaded them to the new account's
 * cloud storage. A September 2026 audit hit exactly that — a new account
 * displaying a STAR score of 62/100 it had never earned.
 *
 * Nothing legitimate is lost: a signed-out visitor cannot reach any module, so
 * there is no anonymous work to carry over.
 */
export function discardLegacyData(): void {
  if (typeof window === "undefined") return
  for (const key of LEGACY_KEYS) {
    localStorage.removeItem(key)
  }
}

/** Notifies mounted components that the cache changed under them. */
export const DATA_SYNCED_EVENT = "gradprocess:data-synced"

export function announceSync() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(DATA_SYNCED_EVENT))
}

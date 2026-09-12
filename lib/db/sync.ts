// Keeps the browser cache and the account's cloud data in agreement.
//
// Runs once per sign-in: claims any pre-account local data for the user, pushes
// anything the cloud is missing, then replaces the cache with the cloud's copy
// so every device converges on the same history.

import {
  activeUser, setActiveUser, discardLegacyData, readLocal, writeLocal, announceSync,
} from "./local"
import {
  getUserId, pullModuleResults, pushModuleResult, pullGamification, pushGamification,
  pullProfile, pushProfile, pullApplications, pushApplication, type PsychEntry,
} from "./cloud"
import type { ScoreStore } from "@/lib/scores"
import type { GamificationState } from "@/lib/gamification"
import type { UserProfile } from "@/lib/profile"
import type { TrackerApp } from "@/lib/tracker/types"

const EMPTY_STORE: ScoreStore = { cv: [], star: [], video: [] }

let inFlight: Promise<void> | null = null

/**
 * Hydrate the cache for the signed-in account. Safe to call repeatedly —
 * concurrent calls share one round trip.
 */
export function syncNow(): Promise<void> {
  if (!inFlight) {
    inFlight = run().finally(() => { inFlight = null })
  }
  return inFlight
}

async function run(): Promise<void> {
  if (typeof window === "undefined") return

  const userId = await getUserId()
  if (!userId) {
    // Signed out: point the cache at the anonymous namespace so nothing from
    // the previous session is readable.
    setActiveUser(null)
    announceSync()
    return
  }

  const switchingAccount = activeUser() !== userId
  setActiveUser(userId)
  // Never adopt pre-account data: it may belong to someone else who used this
  // browser. See discardLegacyData.
  discardLegacyData()

  // Local-first upload: work this account produced while offline gets pushed
  // before the cache is overwritten from the cloud. Skipped when switching
  // accounts, because the cache then holds the previous user's rows.
  if (!switchingAccount) {
    await pushLocalOnlyData()
  }

  await hydrateFromCloud()
  announceSync()
}

async function pushLocalOnlyData(): Promise<void> {
  const localScores = readLocal<ScoreStore>("gradprocess_scores", EMPTY_STORE)
  const localPsych = readLocal<PsychEntry[]>("gradprocess_psych_log", [])
  const localApps = readLocal<TrackerApp[]>("gradprocess_tracker", [])
  const localGam = readLocal<GamificationState | null>("gradprocess_gamification", null)
  const localProfile = readLocal<UserProfile | null>("gradprocess_profile", null)

  const pushes: Promise<unknown>[] = [
    ...localScores.cv.map(e => pushModuleResult("cv", { ...e })),
    ...localScores.star.map(e => pushModuleResult("star", { ...e, label: e.competency })),
    ...localScores.video.map(e => pushModuleResult("video", { ...e, label: e.topic })),
    ...localPsych.map(e => pushModuleResult("psychometric", { ...e, label: e.testName })),
    ...localApps.map(a => pushApplication(a)),
  ]

  if (localGam && localGam.xp > 0) pushes.push(pushGamification(localGam))
  if (localProfile && localProfile.name) pushes.push(pushProfile(localProfile))

  const results = await Promise.allSettled(pushes)
  const failed = results.filter(r => r.status === "rejected").length
  if (failed) console.error(`[sync] ${failed}/${results.length} uploads failed; will retry next sync`)
}

async function hydrateFromCloud(): Promise<void> {
  const [results, gamification, profile, applications] = await Promise.all([
    pullModuleResults(),
    pullGamification(),
    pullProfile(),
    pullApplications(),
  ])

  if (results) {
    writeLocal("gradprocess_scores", results.store)
    writeLocal("gradprocess_psych_log", results.psych)
  }

  if (gamification) {
    const current = readLocal<GamificationState | null>("gradprocess_gamification", null)
    writeLocal("gradprocess_gamification", { ...current, ...gamification })
  }

  if (profile) {
    const current = readLocal<UserProfile | null>("gradprocess_profile", null)
    writeLocal("gradprocess_profile", { ...current, ...profile })
  }

  if (applications) {
    writeLocal("gradprocess_tracker", applications)
  }
}

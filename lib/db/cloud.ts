// Supabase read/write for everything the practice modules produce.
//
// Writes are fire-and-forget from the UI's point of view: the local cache is
// updated first so the interface never waits on the network, and a failed push
// is logged and retried on the next sync rather than blocking the user.

import { createClient } from "@/lib/supabase/client"
import type { ScoreStore, CVScoreEntry, STARScoreEntry, VideoScoreEntry } from "@/lib/scores"
import type { GamificationState } from "@/lib/gamification"
import type { UserProfile } from "@/lib/profile"
import type { TrackerApp } from "@/lib/tracker/types"

export type ModuleName = "cv" | "star" | "video" | "psychometric"

export interface PsychEntry {
  score: number
  date: string
  testName: string
  [key: string]: unknown
}

/** Stable identity for a result row, so re-syncing updates instead of duplicating. */
function resultClientId(module: ModuleName, date: string) {
  return `${module}:${date}`
}

export async function getUserId(): Promise<string | null> {
  const { data } = await createClient().auth.getUser()
  return data.user?.id ?? null
}

// ─── Module results ───────────────────────────────────────────────────────────

interface ResultRow {
  module: ModuleName
  score: number
  label: string | null
  detail: Record<string, unknown>
  created_at: string
}

export async function pullModuleResults(): Promise<{ store: ScoreStore; psych: PsychEntry[] } | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("module_results")
    .select("module, score, label, detail, created_at")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[sync] pull module_results failed:", error.message)
    return null
  }

  const store: ScoreStore = { cv: [], star: [], video: [] }
  const psych: PsychEntry[] = []

  for (const row of (data ?? []) as ResultRow[]) {
    const detail = (row.detail ?? {}) as Record<string, unknown>
    const date = (detail.date as string) ?? row.created_at
    switch (row.module) {
      case "cv":
        store.cv.push({ ...detail, score: row.score, date, jobSpec: (detail.jobSpec as string) ?? "" } as CVScoreEntry)
        break
      case "star":
        store.star.push({ ...detail, score: row.score, date, competency: row.label ?? "" } as unknown as STARScoreEntry)
        break
      case "video":
        store.video.push({ ...detail, score: row.score, date, topic: row.label ?? "" } as unknown as VideoScoreEntry)
        break
      case "psychometric":
        psych.push({ ...detail, score: row.score, date, testName: row.label ?? "" } as PsychEntry)
        break
    }
  }

  return { store, psych }
}

export async function pushModuleResult(
  module: ModuleName,
  entry: { score: number; date: string; label?: string } & Record<string, unknown>
): Promise<void> {
  const userId = await getUserId()
  if (!userId) return

  const { label, ...detail } = entry
  const { error } = await createClient()
    .from("module_results")
    .upsert(
      {
        user_id: userId,
        module,
        score: Math.max(0, Math.min(100, Math.round(entry.score))),
        label: label ?? null,
        detail,
        client_id: resultClientId(module, entry.date),
      },
      { onConflict: "user_id,client_id" }
    )

  if (error) console.error(`[sync] push ${module} result failed:`, error.message)
}

// ─── Gamification ─────────────────────────────────────────────────────────────

export async function pullGamification(): Promise<Partial<GamificationState> | null> {
  const { data, error } = await createClient()
    .from("user_gamification")
    .select("xp, level, streak_days, last_activity, state")
    .maybeSingle()

  if (error) {
    console.error("[sync] pull gamification failed:", error.message)
    return null
  }
  if (!data) return null

  const state = (data.state ?? {}) as Partial<GamificationState>
  return {
    ...state,
    xp: data.xp ?? 0,
    level: data.level ?? 1,
    streakDays: data.streak_days ?? 0,
    lastActivityDate: data.last_activity ?? "",
  }
}

export async function pushGamification(state: GamificationState): Promise<void> {
  const userId = await getUserId()
  if (!userId) return

  const { xp, level, streakDays, lastActivityDate, ...rest } = state
  const { error } = await createClient()
    .from("user_gamification")
    .upsert(
      {
        user_id: userId,
        xp,
        level,
        streak_days: streakDays,
        last_activity: lastActivityDate || null,
        state: rest,
      },
      { onConflict: "user_id" }
    )

  if (error) console.error("[sync] push gamification failed:", error.message)
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function pullProfile(): Promise<Partial<UserProfile> | null> {
  const { data, error } = await createClient()
    .from("user_profiles")
    .select("name, email, university, degree, graduation_year_text, target_sector, target_role, target_companies, onboarding_complete")
    .maybeSingle()

  if (error) {
    console.error("[sync] pull profile failed:", error.message)
    return null
  }
  if (!data) return null

  return {
    name: data.name ?? "",
    email: data.email ?? "",
    university: data.university ?? "",
    degree: data.degree ?? "",
    graduationYear: data.graduation_year_text ?? "",
    targetSector: data.target_sector ?? "",
    targetRole: data.target_role ?? "",
    targetCompanies: Array.isArray(data.target_companies)
      ? data.target_companies.join(", ")
      : (data.target_companies ?? ""),
    onboardingComplete: Boolean(data.onboarding_complete),
  }
}

export async function pushProfile(profile: UserProfile): Promise<void> {
  const userId = await getUserId()
  if (!userId) return

  const companies = profile.targetCompanies
    ? profile.targetCompanies.split(",").map(c => c.trim()).filter(Boolean)
    : []

  const { error } = await createClient()
    .from("user_profiles")
    .update({
      name: profile.name || undefined,
      university: profile.university || null,
      degree: profile.degree || null,
      graduation_year_text: profile.graduationYear || null,
      target_sector: profile.targetSector || null,
      target_role: profile.targetRole || null,
      target_companies: companies,
      onboarding_complete: profile.onboardingComplete,
    })
    .eq("user_id", userId)

  if (error) console.error("[sync] push profile failed:", error.message)
}

// ─── Tracker applications ─────────────────────────────────────────────────────

function rowToApp(row: Record<string, any>): TrackerApp {
  const detail = (row.detail ?? {}) as Record<string, unknown>
  return {
    ...(detail as object),
    id: row.client_id ?? row.id,
    company: row.company,
    role: row.role,
    sector: row.sector ?? "",
    department: row.department ?? undefined,
    location: row.location ?? undefined,
    workType: row.work_type ?? undefined,
    salary: row.salary ?? undefined,
    deadline: row.deadline ?? undefined,
    url: row.url ?? undefined,
    jobDescription: row.job_description ?? undefined,
    stage: row.stage,
    readinessScore: row.readiness_score ?? undefined,
    notes: row.notes ?? "",
    following: row.following ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  } as TrackerApp
}

export async function pullApplications(): Promise<TrackerApp[] | null> {
  const { data, error } = await createClient()
    .from("applications")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[sync] pull applications failed:", error.message)
    return null
  }
  return (data ?? []).map(rowToApp)
}

export async function pushApplication(app: TrackerApp): Promise<void> {
  const userId = await getUserId()
  if (!userId) return

  const {
    id, company, role, sector, department, location, workType, salary, deadline,
    url, jobDescription, stage, readinessScore, notes, following, createdAt, updatedAt,
    ...detail
  } = app as TrackerApp & Record<string, unknown>

  const { error } = await createClient()
    .from("applications")
    .upsert(
      {
        user_id: userId,
        client_id: id,
        company,
        role,
        sector: sector || null,
        department: department || null,
        location: location || null,
        work_type: workType || null,
        salary: salary || null,
        deadline: deadline || null,
        url: url || null,
        job_description: jobDescription || null,
        stage,
        readiness_score: readinessScore ?? null,
        notes: notes ?? "",
        following: following ?? false,
        detail,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,client_id" }
    )

  if (error) console.error("[sync] push application failed:", error.message)
}

export async function deleteApplication(clientId: string): Promise<void> {
  const userId = await getUserId()
  if (!userId) return

  const { error } = await createClient()
    .from("applications")
    .delete()
    .eq("user_id", userId)
    .eq("client_id", clientId)

  if (error) console.error("[sync] delete application failed:", error.message)
}

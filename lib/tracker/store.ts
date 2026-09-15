import type { TrackerApp, Stage, RoleBreakdown } from "./types"
import { readLocal, writeLocal } from "@/lib/db/local"
import { pushApplication, deleteApplication } from "@/lib/db/cloud"

function load(): TrackerApp[] {
  return dedupe(readLocal<TrackerApp[]>("gradprocess_tracker", []))
}

/**
 * Collapses duplicate applications.
 *
 * Rows saved before `client_id` existed sync back with the database UUID as
 * their id, so the same application could round-trip into a second row and
 * show as two identical cards. Keep the first of each id, then the first of
 * each company+role+stage triple, preserving order.
 */
export function dedupe(apps: TrackerApp[]): TrackerApp[] {
  const seenIds = new Set<string>()
  const seenKeys = new Set<string>()
  const out: TrackerApp[] = []

  for (const app of apps) {
    if (app.id && seenIds.has(app.id)) continue
    const key = [
      (app.company ?? "").trim().toLowerCase(),
      (app.role ?? "").trim().toLowerCase(),
      app.stage,
    ].join("::")
    if (seenKeys.has(key)) continue
    if (app.id) seenIds.add(app.id)
    seenKeys.add(key)
    out.push(app)
  }
  return out
}

/**
 * Fills in the list fields a breakdown is typed as always having.
 *
 * The breakdown is now generated in three parts that are rendered as each
 * lands, so a saved record can legitimately hold only some of them — and a
 * failed part leaves it that way permanently. The detail page reads
 * b.likelyInterviewStages.length, b.interviewQuestions.map and others
 * directly, so a partial breakdown crashed the Overview, AI Breakdown,
 * Interview Prep and STAR Stories tabs outright.
 */
function normaliseBreakdown(b: any): any {
  if (!b || typeof b !== "object") return b
  const list = (v: unknown) => (Array.isArray(v) ? v : [])
  return {
    ...b,
    keyResponsibilities: list(b.keyResponsibilities),
    keySkills: list(b.keySkills),
    competencies: list(b.competencies),
    technicalAreas: list(b.technicalAreas),
    commercialThemes: list(b.commercialThemes),
    interviewQuestions: list(b.interviewQuestions),
    starSuggestions: list(b.starSuggestions),
    prepRoadmap: list(b.prepRoadmap),
    gapAnalysis: list(b.gapAnalysis),
    atsRecommendations: list(b.atsRecommendations),
    likelyInterviewStages: list(b.likelyInterviewStages),
    assessmentCentreExpectations: list(b.assessmentCentreExpectations),
  }
}

/**
 * Fills in the list fields an application is typed as always having.
 *
 * TrackerApp declares skills, softSkills, responsibilities, requirements and
 * stageHistory as arrays, but nothing guarantees a stored record has them:
 * entries saved before those fields existed, and ones added by hand, do not.
 * The detail page read `app.skills.length` directly and crashed the whole tab
 * with "Cannot read properties of undefined (reading 'length')" — the browser's
 * own error page, not an error boundary.
 *
 * Normalising here means every reader gets the shape the type promises, rather
 * than each one guarding separately and the next one forgetting.
 */
function normalise(app: any): TrackerApp {
  return {
    ...app,
    skills: Array.isArray(app?.skills) ? app.skills : [],
    softSkills: Array.isArray(app?.softSkills) ? app.softSkills : [],
    responsibilities: Array.isArray(app?.responsibilities) ? app.responsibilities : [],
    requirements: Array.isArray(app?.requirements) ? app.requirements : [],
    stageHistory: Array.isArray(app?.stageHistory) ? app.stageHistory : [],
    interviewDates: Array.isArray(app?.interviewDates) ? app.interviewDates : [],
    breakdown: app?.breakdown ? normaliseBreakdown(app.breakdown) : app?.breakdown,
  } as TrackerApp
}

function save(apps: TrackerApp[]) {
  writeLocal("gradprocess_tracker", apps)
}

export function loadApps(): TrackerApp[] {
  return load().map(normalise)
}

export function getApp(id: string): TrackerApp | null {
  const found = load().find(a => a.id === id)
  return found ? normalise(found) : null
}

export function addApp(app: TrackerApp): void {
  const apps = load()
  apps.unshift(app)
  save(apps)
  void pushApplication(app)
}

export function updateApp(id: string, updates: Partial<TrackerApp>): TrackerApp | null {
  const apps = load()
  const idx = apps.findIndex(a => a.id === id)
  if (idx === -1) return null
  apps[idx] = { ...apps[idx], ...updates, updatedAt: new Date().toISOString() }
  save(apps)
  void pushApplication(apps[idx])
  return apps[idx]
}

export function deleteApp(id: string): void {
  const apps = load().filter(a => a.id !== id)
  save(apps)
  void deleteApplication(id)
}

export function moveToStage(id: string, stage: Stage, note?: string): TrackerApp | null {
  const apps = load()
  const idx = apps.findIndex(a => a.id === id)
  if (idx === -1) return null
  const app = apps[idx]
  app.stage = stage
  app.stageHistory = [...(app.stageHistory || []), { stage, date: new Date().toISOString(), note }]
  app.updatedAt = new Date().toISOString()
  apps[idx] = app
  save(apps)
  void pushApplication(app)
  return app
}

export function saveBreakdown(id: string, breakdown: RoleBreakdown): TrackerApp | null {
  // readinessScore is no longer part of a breakdown — it described the role,
  // not the applicant. The tracker reads the user's real module scores instead.
  return updateApp(id, { breakdown })
}

export function createApp(partial: {
  company: string
  role: string
  sector: string
  department?: string
  location?: string
  workType?: "Remote" | "Hybrid" | "On-site"
  salary?: string
  deadline?: string
  url?: string
  jobDescription?: string
  skills?: string[]
  softSkills?: string[]
  responsibilities?: string[]
  requirements?: string[]
  stage?: Stage
}): TrackerApp {
  const now = new Date().toISOString()
  const stage = partial.stage ?? "saved"
  return {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    company: partial.company,
    role: partial.role,
    sector: partial.sector,
    department: partial.department,
    location: partial.location,
    workType: partial.workType,
    salary: partial.salary,
    deadline: partial.deadline,
    url: partial.url,
    jobDescription: partial.jobDescription,
    stage,
    stageHistory: [{ stage, date: now }],
    skills: partial.skills ?? [],
    softSkills: partial.softSkills ?? [],
    responsibilities: partial.responsibilities ?? [],
    requirements: partial.requirements ?? [],
    notes: "",
    interviewDates: [],
    following: false,
  }
}

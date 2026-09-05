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

function save(apps: TrackerApp[]) {
  writeLocal("gradprocess_tracker", apps)
}

export function loadApps(): TrackerApp[] {
  return load()
}

export function getApp(id: string): TrackerApp | null {
  return load().find(a => a.id === id) ?? null
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
  return updateApp(id, { breakdown, readinessScore: breakdown.readinessScore })
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

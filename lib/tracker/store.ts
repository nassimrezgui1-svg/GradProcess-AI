import type { TrackerApp, Stage, RoleBreakdown } from "./types"

const KEY = "gradprocess_tracker"

function load(): TrackerApp[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function save(apps: TrackerApp[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(KEY, JSON.stringify(apps))
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
}

export function updateApp(id: string, updates: Partial<TrackerApp>): TrackerApp | null {
  const apps = load()
  const idx = apps.findIndex(a => a.id === id)
  if (idx === -1) return null
  apps[idx] = { ...apps[idx], ...updates, updatedAt: new Date().toISOString() }
  save(apps)
  return apps[idx]
}

export function deleteApp(id: string): void {
  const apps = load().filter(a => a.id !== id)
  save(apps)
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

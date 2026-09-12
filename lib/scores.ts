// Shared localStorage score store — read/written by all modules, consumed by Dashboard

export interface CVScoreEntry {
  score: number
  date: string
  jobSpec: string
}

export interface STARScoreEntry {
  score: number
  competency: string
  experienceText: string
  date: string
}

export interface VideoScoreEntry {
  score: number
  date: string
  topic: string
  sector?: string
  mode?: string
  difficulty?: string
  questionCount?: number
  contentScore?: number
  starScore?: number
  deliveryScore?: number
  commercialScore?: number
  communicationScore?: number
  totalFillerWords?: number
  avgWordsPerMinute?: number
  durationSeconds?: number
  strengths?: string[]
  improvements?: string[]
  sessionId?: string
}

export interface ScoreStore {
  cv: CVScoreEntry[]
  star: STARScoreEntry[]
  video: VideoScoreEntry[]
}

import { readLocal, writeLocal } from "@/lib/db/local"
import { awardXP } from "@/lib/gamification"

/**
 * XP granted for completing each module, matching the "+N XP" shown on the
 * dashboard tiles. Nothing used to call awardXP at all, so the counter sat at
 * "0 XP · Starter Applicant" no matter how much work was done.
 */
export const MODULE_XP = { cv: 50, star: 30, video: 60, psychometric: 40 } as const
import { pushModuleResult } from "@/lib/db/cloud"

const EMPTY: ScoreStore = { cv: [], star: [], video: [] }

function load(): ScoreStore {
  return readLocal<ScoreStore>("gradprocess_scores", EMPTY)
}

function save(store: ScoreStore) {
  writeLocal("gradprocess_scores", store)
}

export function saveCVScore(entry: CVScoreEntry) {
  const store = load()
  store.cv = [entry, ...store.cv].slice(0, 20)
  save(store)
  awardXP(MODULE_XP.cv, "cv")
  void pushModuleResult("cv", { ...entry })
}

export function saveSTARScore(entry: STARScoreEntry) {
  const store = load()
  store.star = [entry, ...store.star].slice(0, 50)
  save(store)
  awardXP(MODULE_XP.star, "star")
  void pushModuleResult("star", { ...entry, label: entry.competency })
}

export function saveVideoScore(entry: VideoScoreEntry) {
  const store = load()
  store.video = [entry, ...store.video].slice(0, 20)
  save(store)
  awardXP(MODULE_XP.video, "video")
  void pushModuleResult("video", { ...entry, label: entry.topic })
}

/** Psychometric sessions are logged separately but share the results table. */
export function savePsychScore(entry: { score: number; date: string; testName: string } & Record<string, unknown>) {
  const log = readLocal<Record<string, unknown>[]>("gradprocess_psych_log", [])
  writeLocal("gradprocess_psych_log", [entry, ...log].slice(0, 50))
  awardXP(MODULE_XP.psychometric, "psychometric")
  void pushModuleResult("psychometric", { ...entry, label: entry.testName })
}

export interface DashboardScores {
  cv: number | null
  star: number | null
  video: number | null
  psychometric: number | null
  overall: number | null
  weakest: { label: string; score: number } | null
  strongest: { label: string; score: number } | null
  recentSessions: { label: string; score: number; date: string }[]
  psychLog: any[]
  cvLog: CVScoreEntry[]
  starLog: STARScoreEntry[]
  videoLog: VideoScoreEntry[]
  radarData: { module: string; score: number; fullMark: number }[]
}

export function loadDashboardScores(): DashboardScores {
  const store = load()

  // Psychometric: average of all sessions
  const psychLog = readLocal<any[]>("gradprocess_psych_log", [])

  const cv = store.cv.length > 0 ? store.cv[0].score : null
  const star = store.star.length > 0
    ? Math.round(store.star.reduce((s, e) => s + e.score, 0) / store.star.length)
    : null
  const video = store.video.length > 0 ? store.video[0].score : null
  const psychometric = psychLog.length > 0
    ? Math.round(psychLog.reduce((s: number, e: any) => s + e.score, 0) / psychLog.length)
    : null

  const moduleList = [
    { label: "CV & ATS", score: cv },
    { label: "STAR", score: star },
    { label: "Video Interview", score: video },
    { label: "Psychometric", score: psychometric },
  ].filter(m => m.score !== null) as { label: string; score: number }[]

  const overall = moduleList.length > 0
    ? Math.round(moduleList.reduce((s, m) => s + m.score, 0) / moduleList.length)
    : null

  const sorted = [...moduleList].sort((a, b) => a.score - b.score)
  const weakest: { label: string; score: number } | null = sorted[0] ?? null
  const strongest: { label: string; score: number } | null = sorted[sorted.length - 1] ?? null

  // Recent sessions: merge across all types, sort by date desc, take top 6
  const recentSessions: { label: string; score: number; date: string }[] = [
    ...store.cv.map(e => ({ label: "CV Analysis", score: e.score, date: e.date })),
    ...store.star.map(e => ({ label: `STAR — ${e.competency}`, score: e.score, date: e.date })),
    ...store.video.map(e => ({ label: `Video — ${e.topic}`, score: e.score, date: e.date })),
    ...psychLog.map((e: any) => ({ label: `Psychometric — ${e.testName}`, score: e.score, date: e.date })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6)

  const radarData = [
    { module: "CV", score: cv ?? 0, fullMark: 100 },
    { module: "STAR", score: star ?? 0, fullMark: 100 },
    { module: "Video", score: video ?? 0, fullMark: 100 },
    { module: "Psychometric", score: psychometric ?? 0, fullMark: 100 },
  ]

  return {
    cv, star, video, psychometric, overall,
    weakest, strongest,
    recentSessions,
    psychLog,
    cvLog: store.cv,
    starLog: store.star,
    videoLog: store.video,
    radarData,
  }
}

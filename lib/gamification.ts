// Gamification engine — XP, levels, streaks, badges, daily challenges

export interface GamificationState {
  xp: number
  level: number
  levelName: string
  streakDays: number
  lastActivityDate: string
  badges: string[]
  completedChallenges: string[] // IDs completed today
  xpByCategory: Record<string, number>
  weeklyXP: number
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  xpReward: number
}

export interface DailyChallenge {
  id: string
  title: string
  description: string
  module: string
  xpReward: number
  href: string
  completed: boolean
}

const LEVELS = [
  { level: 1, name: "Starter Applicant", minXP: 0 },
  { level: 2, name: "Shortlist Seeker", minXP: 150 },
  { level: 3, name: "Screen Passer", minXP: 400 },
  { level: 4, name: "Interview Contender", minXP: 800 },
  { level: 5, name: "Assessment Centre Candidate", minXP: 1400 },
  { level: 6, name: "Finalist", minXP: 2200 },
  { level: 7, name: "Offer Ready", minXP: 3200 },
  { level: 8, name: "Elite Graduate Candidate", minXP: 5000 },
]

export const XP_REWARDS = {
  cvAnalysis: 50,
  starGenerated: 30,
  psychometricTest: 40,
  videoInterview: 60,
  dailyChallenge: 25,
  streakBonus: 15,
  industryInsight: 10,
}

const BADGES_DEFINITION: Omit<Badge, "unlocked">[] = [
  { id: "ats_optimised", name: "ATS Optimised", description: "Score 75+ on CV analysis", icon: "🎯", xpReward: 100 },
  { id: "star_communicator", name: "STAR Communicator", description: "Generate 5+ STAR answers", icon: "⭐", xpReward: 100 },
  { id: "commercially_aware", name: "Commercially Aware", description: "Read 10 industry news articles", icon: "📊", xpReward: 75 },
  { id: "numerical_ninja", name: "Numerical Ninja", description: "Score 80+ in numerical reasoning", icon: "🔢", xpReward: 100 },
  { id: "psychometric_sprinter", name: "Psychometric Sprinter", description: "Complete 5 psychometric tests", icon: "⚡", xpReward: 75 },
  { id: "interview_ready", name: "Interview Ready", description: "Complete 3 video interview sessions", icon: "🎙️", xpReward: 150 },
  { id: "elite_storyteller", name: "Elite Storyteller", description: "Score 85+ on a STAR answer", icon: "🏆", xpReward: 200 },
  { id: "streak_5", name: "5-Day Streak", description: "Practice 5 days in a row", icon: "🔥", xpReward: 100 },
  { id: "streak_14", name: "14-Day Streak", description: "Practice 14 days in a row", icon: "💎", xpReward: 300 },
  { id: "offer_ready", name: "Offer Ready", description: "Reach 85+ overall readiness", icon: "🥇", xpReward: 500 },
]

const DAILY_CHALLENGE_POOL: Omit<DailyChallenge, "completed">[] = [
  { id: "dc_cv_bullet", title: "Rewrite a weak CV bullet", description: "Upload your CV and improve 1 bullet point using AI feedback", module: "CV", xpReward: 25, href: "/cv-tailoring" },
  { id: "dc_numerical", title: "Complete 10 numerical questions", description: "Practice speed and accuracy in numerical reasoning", module: "Psychometric", xpReward: 25, href: "/psychometric" },
  { id: "dc_star", title: "Generate a new STAR answer", description: "Build a STAR answer for a competency you haven't covered yet", module: "STAR", xpReward: 25, href: "/star-builder" },
  { id: "dc_commercial", title: "Read today's market briefing", description: "Stay current on sector trends relevant to your target firms", module: "Industry", xpReward: 20, href: "/industry-hub" },
  { id: "dc_verbal", title: "Complete 10 verbal reasoning questions", description: "True/false/cannot say at timed pace", module: "Psychometric", xpReward: 25, href: "/psychometric" },
  { id: "dc_video", title: "Record a 60-second interview response", description: "Answer one competency question on camera", module: "Video", xpReward: 30, href: "/video-interview" },
  { id: "dc_logical", title: "Beat your logical reasoning score", description: "Improve on your last logical reasoning test result", module: "Psychometric", xpReward: 25, href: "/psychometric" },
  { id: "dc_cv_scan", title: "Scan your CV against a new job spec", description: "Try a different target role to check keyword fit", module: "CV", xpReward: 20, href: "/cv-tailoring" },
]

const KEY = "gradprocess_gamification"

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10)
}

function getLevel(xp: number): { level: number; name: string; nextXP: number; prevXP: number } {
  let current = LEVELS[0]
  for (const l of LEVELS) {
    if (xp >= l.minXP) current = l
  }
  const idx = LEVELS.indexOf(current)
  const next = LEVELS[idx + 1]
  return {
    level: current.level,
    name: current.name,
    nextXP: next ? next.minXP : current.minXP + 1000,
    prevXP: current.minXP,
  }
}

export function loadGamification(): GamificationState {
  if (typeof window === "undefined") return getDefaultState()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return getDefaultState()
    const state: GamificationState = JSON.parse(raw)
    // Reset daily challenges if new day
    if (state.lastActivityDate !== getTodayString()) {
      state.completedChallenges = []
    }
    return state
  } catch {
    return getDefaultState()
  }
}

function getDefaultState(): GamificationState {
  return {
    xp: 0,
    level: 1,
    levelName: "Starter Applicant",
    streakDays: 0,
    lastActivityDate: "",
    badges: [],
    completedChallenges: [],
    xpByCategory: {},
    weeklyXP: 0,
  }
}

function saveGamification(state: GamificationState) {
  if (typeof window === "undefined") return
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function awardXP(amount: number, category: string): { newState: GamificationState; leveledUp: boolean; newBadges: string[] } {
  const state = loadGamification()
  const oldLevel = getLevel(state.xp).level

  state.xp += amount
  state.xpByCategory[category] = (state.xpByCategory[category] || 0) + amount
  state.weeklyXP += amount

  // Update streak
  const today = getTodayString()
  if (state.lastActivityDate === "") {
    state.streakDays = 1
  } else if (state.lastActivityDate !== today) {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    if (state.lastActivityDate === yesterday.toISOString().slice(0, 10)) {
      state.streakDays += 1
    } else {
      state.streakDays = 1
    }
  }
  state.lastActivityDate = today

  const newLevelInfo = getLevel(state.xp)
  state.level = newLevelInfo.level
  state.levelName = newLevelInfo.name

  // Check badge unlocks
  const newBadges: string[] = []
  if (state.streakDays >= 5 && !state.badges.includes("streak_5")) {
    state.badges.push("streak_5")
    newBadges.push("streak_5")
    state.xp += 100
  }
  if (state.streakDays >= 14 && !state.badges.includes("streak_14")) {
    state.badges.push("streak_14")
    newBadges.push("streak_14")
    state.xp += 300
  }

  saveGamification(state)
  return { newState: state, leveledUp: newLevelInfo.level > oldLevel, newBadges }
}

export function completeChallenge(challengeId: string): void {
  const state = loadGamification()
  if (!state.completedChallenges.includes(challengeId)) {
    state.completedChallenges.push(challengeId)
    saveGamification(state)
    awardXP(XP_REWARDS.dailyChallenge, "Daily Challenges")
  }
}

export function unlockBadge(badgeId: string): void {
  const state = loadGamification()
  if (!state.badges.includes(badgeId)) {
    state.badges.push(badgeId)
    const def = BADGES_DEFINITION.find(b => b.id === badgeId)
    if (def) {
      state.xp += def.xpReward
      saveGamification(state)
    }
  }
}

export function getLevelInfo(xp: number) {
  return getLevel(xp)
}

export function getLevelProgress(xp: number): number {
  const info = getLevel(xp)
  const range = info.nextXP - info.prevXP
  const progress = xp - info.prevXP
  return Math.min(100, Math.round((progress / range) * 100))
}

export function getTodaysChallenges(state: GamificationState): DailyChallenge[] {
  // Pick 3 deterministic challenges based on day of year
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  const indices = [
    dayOfYear % DAILY_CHALLENGE_POOL.length,
    (dayOfYear + 2) % DAILY_CHALLENGE_POOL.length,
    (dayOfYear + 5) % DAILY_CHALLENGE_POOL.length,
  ]
  return indices.map(i => ({
    ...DAILY_CHALLENGE_POOL[i],
    completed: state.completedChallenges.includes(DAILY_CHALLENGE_POOL[i].id),
  }))
}

export function getBadges(state: GamificationState): Badge[] {
  return BADGES_DEFINITION.map(b => ({
    ...b,
    unlocked: state.badges.includes(b.id),
  }))
}

export function getCompanyReadiness(overallScore: number): { company: string; sector: string; likelihood: number; color: string }[] {
  const base = overallScore ?? 0
  return [
    { company: "Deloitte", sector: "Consulting", likelihood: Math.min(95, Math.round(base * 0.95 + Math.random() * 5)), color: "#00b04f" },
    { company: "PwC", sector: "Consulting", likelihood: Math.min(95, Math.round(base * 0.93 + Math.random() * 5)), color: "#d04a02" },
    { company: "McKinsey", sector: "Consulting", likelihood: Math.min(90, Math.round(base * 0.72)), color: "#00a9e0" },
    { company: "Goldman Sachs", sector: "Banking", likelihood: Math.min(90, Math.round(base * 0.68)), color: "#6d9fd6" },
    { company: "JPMorgan", sector: "Banking", likelihood: Math.min(90, Math.round(base * 0.74)), color: "#005eb8" },
    { company: "Barclays", sector: "Banking", likelihood: Math.min(90, Math.round(base * 0.82)), color: "#00aeef" },
    { company: "KPMG", sector: "Consulting", likelihood: Math.min(95, Math.round(base * 0.91 + Math.random() * 4)), color: "#0091da" },
    { company: "BlackRock", sector: "Asset Mgmt", likelihood: Math.min(90, Math.round(base * 0.76)), color: "#000000" },
  ].sort((a, b) => b.likelihood - a.likelihood)
}

export { BADGES_DEFINITION }

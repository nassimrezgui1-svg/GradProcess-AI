export type Stage =
  | "saved" | "interested" | "preparing" | "applied"
  | "online_assessment" | "psychometric" | "video_interview"
  | "first_interview" | "assessment_centre" | "final_interview"
  | "offer" | "rejected" | "withdrawn"

export interface StageConfig {
  id: Stage
  label: string
  short: string
  color: string
  bg: string
  text: string
  border: string
  terminal?: boolean
}

export const STAGES: StageConfig[] = [
  { id: "saved",             label: "Saved",             short: "Saved",     color: "#9CA3AF", bg: "#F9FAFB", text: "#374151", border: "#E5E7EB" },
  { id: "interested",        label: "Interested",        short: "Interested",color: "#3B82F6", bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  { id: "preparing",         label: "Preparing",         short: "Preparing", color: "#8B5CF6", bg: "#F5F3FF", text: "#6D28D9", border: "#DDD6FE" },
  { id: "applied",           label: "Applied",           short: "Applied",   color: "#6366F1", bg: "#EEF2FF", text: "#4338CA", border: "#C7D2FE" },
  { id: "online_assessment", label: "Online Assessment", short: "OA",        color: "#06B6D4", bg: "#ECFEFF", text: "#0E7490", border: "#A5F3FC" },
  { id: "psychometric",      label: "Psychometric",      short: "Psych",     color: "#14B8A6", bg: "#F0FDFA", text: "#0F766E", border: "#99F6E4" },
  { id: "video_interview",   label: "Video Interview",   short: "VI",        color: "#7C3AED", bg: "#EDE9FE", text: "#5B21B6", border: "#C4B5FD" },
  { id: "first_interview",   label: "First Interview",   short: "1st IV",    color: "#F97316", bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA" },
  { id: "assessment_centre", label: "Assessment Centre", short: "AC",        color: "#F59E0B", bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
  { id: "final_interview",   label: "Final Interview",   short: "Final IV",  color: "#EF4444", bg: "#FEF2F2", text: "#B91C1C", border: "#FECACA" },
  { id: "offer",             label: "Offer 🎉",           short: "Offer",     color: "#10B981", bg: "#ECFDF5", text: "#065F46", border: "#A7F3D0", terminal: true },
  { id: "rejected",          label: "Rejected",          short: "Rejected",  color: "#F43F5E", bg: "#FFF1F2", text: "#9F1239", border: "#FECDD3", terminal: true },
  { id: "withdrawn",         label: "Withdrawn",         short: "Withdrawn", color: "#6B7280", bg: "#F3F4F6", text: "#374151", border: "#D1D5DB", terminal: true },
]

export const PIPELINE_STAGES = STAGES.filter(s => !s.terminal)
export const TERMINAL_STAGES = STAGES.filter(s => s.terminal)

export function getStage(id: Stage): StageConfig {
  return STAGES.find(s => s.id === id) ?? STAGES[0]
}

export interface StageHistoryEntry {
  stage: Stage
  date: string
  note?: string
}

export interface InterviewDate {
  label: string
  date: string
}

export interface TrackerApp {
  id: string
  createdAt: string
  updatedAt: string
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
  stage: Stage
  stageHistory: StageHistoryEntry[]
  skills: string[]
  softSkills: string[]
  responsibilities: string[]
  requirements: string[]
  breakdown?: RoleBreakdown
  readinessScore?: number
  atsMatch?: number
  notes: string
  recruiterName?: string
  recruiterEmail?: string
  interviewDates: InterviewDate[]
  following: boolean
}

export interface RoleBreakdown {
  roleSummary: string
  companyOverview: string
  keyResponsibilities: string[]
  keySkills: string[]
  competencies: string[]
  technicalAreas: string[]
  commercialThemes: string[]
  interviewQuestions: { competency: string; question: string }[]
  starSuggestions: { competency: string; suggestion: string }[]
  prepRoadmap: { period: string; tasks: string[] }[]
  readinessScore: number
  gapAnalysis: string[]
  atsRecommendations: string[]
  cultureInsights: string
  likelyInterviewStages: string[]
  assessmentCentreExpectations: string[]
  generatedAt: string
}

export function getReadinessBand(score: number): { label: string; color: string; bg: string } {
  if (score >= 90) return { label: "Highly Competitive",       color: "#059669", bg: "#ECFDF5" }
  if (score >= 75) return { label: "Interview Ready",          color: "#2563EB", bg: "#EFF6FF" }
  if (score >= 60) return { label: "Strong Foundation",        color: "#7C3AED", bg: "#F5F3FF" }
  if (score >= 40) return { label: "Developing Readiness",     color: "#D97706", bg: "#FFFBEB" }
  return              { label: "Early Preparation Needed",  color: "#DC2626", bg: "#FEF2F2" }
}

export const SECTORS = [
  "Banking", "Investment Banking", "Consulting", "Asset Management",
  "Wealth Management", "Insurance", "Technology", "Law",
  "Engineering", "FMCG", "Energy", "Healthcare", "Public Sector", "Other",
]

import { z } from "zod"

// ─── Schemas ────────────────────────────────────────────────────────────────

export const CVAnalysisSchema = z.object({
  overallScore: z.number(),
  passLikelihood: z.enum(["High risk", "Medium risk", "Strong match"]),
  breakdown: z.record(z.string(), z.number()),
  matchedKeywords: z.array(z.string()),
  missingKeywords: z.array(z.string()),
  weakBullets: z.array(z.string()),
  rewrittenBullets: z.array(z.string()),
  tailoredSummary: z.string(),
  formattingWarnings: z.array(z.string()),
  missingItems: z.array(z.string()),
  recommendations: z.array(z.string()),
})

export const STARAnalysisSchema = z.object({
  score: z.number(),
  starCompleteness: z.number(),
  competency: z.string(),
  situation: z.string(),
  task: z.string(),
  action: z.string(),
  result: z.string(),
  improvedVersion: z.string(),
  version60s: z.string(),
  version90s: z.string(),
  version2min: z.string(),
  improvements: z.array(z.string()),
  missingElements: z.array(z.string()),
  followUpQuestions: z.array(z.string()),
  interviewerRiskFlags: z.array(z.string()),
})

export const InterviewScoreSchema = z.object({
  overallScore: z.number(),
  contentScore: z.number(),
  deliveryScore: z.number(),
  starScore: z.number(),
  commercialAwarenessScore: z.number(),
  roleFitScore: z.number(),
  confidenceScore: z.number(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  missedOpportunities: z.array(z.string()),
  modelAnswer: z.string(),
  rewrittenAnswer: z.string(),
})

export type CVAnalysis = z.infer<typeof CVAnalysisSchema>
export type STARAnalysis = z.infer<typeof STARAnalysisSchema>
export type InterviewScore = z.infer<typeof InterviewScoreSchema>

// ─── Helper ──────────────────────────────────────────────────────────────────

async function post<T>(route: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(route, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(err.error || `Request failed: ${res.status}`)
  }
  return res.json()
}

// ─── AI Service Functions ────────────────────────────────────────────────────

export async function analyseCVAgainstJobSpec(cv: string, jobSpec: string): Promise<CVAnalysis> {
  return post<CVAnalysis>("/api/ai/analyse-cv", { cv, jobSpec })
}

export async function generateSTARScenario(
  cv: string,
  competency: string,
  targetRole?: string,
  targetSector?: string
): Promise<STARAnalysis> {
  return post<STARAnalysis>("/api/ai/generate-star", { cv, competency, targetRole, targetSector })
}

export async function generateInterviewQuestion(
  sector: string,
  role: string,
  mode: string,
  previousQuestions: string[] = []
): Promise<{ question: string; type: string; hint: string; timeLimit: number }> {
  return post("/api/ai/interview-question", { sector, role, mode, previousQuestions })
}

export async function scoreInterviewResponse(
  question: string,
  transcript: string,
  sector?: string,
  role?: string,
  questionType?: string
): Promise<InterviewScore> {
  return post<InterviewScore>("/api/ai/score-interview", {
    question,
    transcript,
    sector,
    role,
    questionType,
  })
}

export async function generatePsychometricQuiz(
  type: string,
  difficulty: string = "medium",
  count: number = 5
): Promise<{ questions: any[] }> {
  return post("/api/ai/psychometric-quiz", { type, difficulty, count })
}

export async function getSectorInsight(
  sector: string,
  topic?: string
): Promise<{
  keyPoints: string[]
  interviewTalkingPoints: string[]
  sampleQuestion: string
  strongAnswer: string
  datPoints: string[]
  watchOut: string
}> {
  return post("/api/ai/sector-insight", { sector, topic })
}

export async function generateReadinessReport(
  scores: Record<string, number>,
  targetRole?: string,
  targetSector?: string,
  targetCompanies?: string[]
): Promise<{
  overallAssessment: string
  readinessVerdict: string
  strongestArea: string
  weakestArea: string
  priorityActions: { action: string; impact: string; timeframe: string }[]
  weeklyPlan: { week: number; focus: string; tasks: string[] }[]
  applicationAdvice: string
}> {
  return post("/api/ai/readiness-report", { scores, targetRole, targetSector, targetCompanies })
}

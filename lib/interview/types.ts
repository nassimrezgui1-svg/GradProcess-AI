export type InterviewMode = "Competency" | "Strengths" | "Motivational" | "Technical" | "Commercial" | "Situational" | "Leadership" | "Behavioral" | "Mixed"
export type Difficulty = "Beginner" | "Intermediate" | "Advanced" | "Assessment Centre" | "Elite"
export type Phase = "setup" | "permissions" | "question" | "recording" | "analyzing" | "feedback" | "report"

export interface InterviewSetup {
  sector: string
  role: string
  mode: InterviewMode
  difficulty: Difficulty
  questionCount: number
}

export interface InterviewQuestion {
  id: string
  text: string
  type: InterviewMode
  competency: string
  hint: string
  suggestedSeconds: number
  isFollowUp: boolean
  parentId?: string
}

export interface FillerWordResult {
  total: number
  perMinute: number
  breakdown: Record<string, number>
  severity: "low" | "medium" | "high"
}

export interface StarAnalysis {
  hasSituation: boolean
  hasTask: boolean
  hasAction: boolean
  hasResult: boolean
  situationScore: number
  taskScore: number
  actionScore: number
  resultScore: number
  hasQuantifiedResult: boolean
  hasOwnership: boolean
  overallScore: number
  feedback: string
}

export interface DeliveryMetrics {
  wordsPerMinute: number
  durationSeconds: number
  wordCount: number
  pauseCount: number
  pacing: "too slow" | "good" | "too fast"
}

export interface AnswerAnalysis {
  questionId: string
  questionText: string
  transcript: string
  durationSeconds: number
  fillerWords: FillerWordResult
  star: StarAnalysis
  delivery: DeliveryMetrics
  contentScore: number
  starScore: number
  deliveryScore: number
  communicationScore: number
  commercialScore: number
  overallScore: number
  strengths: string[]
  improvements: string[]
  idealAnswer: string
  followUpQuestion: string | null
  followUpReason: string | null
}

export interface FinalReport {
  overallScore: number
  contentScore: number
  starScore: number
  deliveryScore: number
  commercialScore: number
  communicationScore: number
  bodyLanguageScore: number
  totalFillerWords: number
  avgWordsPerMinute: number
  totalDurationSeconds: number
  strengths: string[]
  improvements: string[]
  improvementRoadmap: string[]
  recruiterFeedback: string
  strongestAnswerIndex: number
  weakestAnswerIndex: number
  nextSteps: string[]
  sessionId: string
}

export interface StoredSession {
  id: string
  timestamp: number
  setup: InterviewSetup
  questions: InterviewQuestion[]
  answers: AnswerAnalysis[]
  report: FinalReport | null
}

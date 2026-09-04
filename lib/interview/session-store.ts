import { readLocal, writeLocal } from "@/lib/db/local"
import type { StoredSession, AnswerAnalysis, FinalReport, InterviewQuestion, InterviewSetup } from "./types"

export function loadSessions(): StoredSession[] {
  return readLocal<StoredSession[]>("gradprocess_interview_sessions", [])
}

export function saveSession(session: StoredSession): void {
  const sessions = loadSessions()
  const existing = sessions.findIndex(s => s.id === session.id)
  if (existing >= 0) sessions[existing] = session
  else sessions.unshift(session)
  writeLocal("gradprocess_interview_sessions", sessions.slice(0, 20))
}

export function createSession(setup: InterviewSetup, questions: InterviewQuestion[]): StoredSession {
  return {
    id: `interview_${Date.now()}`,
    timestamp: Date.now(),
    setup,
    questions,
    answers: [],
    report: null,
  }
}

export function addAnswerToSession(session: StoredSession, answer: AnswerAnalysis): StoredSession {
  return { ...session, answers: [...session.answers, answer] }
}

export function finalizeSession(session: StoredSession, report: FinalReport): StoredSession {
  return { ...session, report }
}

export function getLastSession(): StoredSession | null {
  return loadSessions()[0] ?? null
}

"use client"
import { useState, useEffect, useCallback } from "react"
import { Topbar } from "@/components/layout/topbar"
import { psychometricTests } from "@/lib/mock-data"
import { cn, getScoreColor, getScoreLabel, getScoreBg } from "@/lib/utils"
import {
  Calculator, BookOpen, Brain, Shapes, Scale, Eye,
  Play, RotateCcw, Trophy, Clock, CheckCircle, XCircle,
  Loader2, TrendingUp, BarChart3, History, ChevronRight,
  AlertCircle, Zap, Target
} from "lucide-react"

// ─── Types ──────────────────────────────────────────────────────────────────

interface Question {
  id: string
  type: string
  difficulty: string
  passage?: string
  question: string
  options: string[]
  correct: number
  explanation: string
  timeLimit: number
}

interface AnswerRecord {
  questionId: string
  question: string
  selected: number
  correct: number
  isCorrect: boolean
  timeTaken: number
  explanation: string
  options: string[]
}

interface TestSession {
  id: string
  testType: string
  testName: string
  date: string
  score: number
  correct: number
  total: number
  avgTime: number
  answers: AnswerRecord[]
}

type Phase = "selection" | "loading" | "active" | "results"

const STORAGE_KEY = "gradprocess_psych_log"

const iconMap: Record<string, React.ReactNode> = {
  calculator: <Calculator className="w-6 h-6" />,
  book: <BookOpen className="w-6 h-6" />,
  brain: <Brain className="w-6 h-6" />,
  shapes: <Shapes className="w-6 h-6" />,
  scale: <Scale className="w-6 h-6" />,
  eye: <Eye className="w-6 h-6" />,
}

const testColors: Record<string, string> = {
  numerical: "bg-blue-100 text-blue-600",
  verbal: "bg-purple-100 text-purple-600",
  logical: "bg-green-100 text-green-600",
  abstract: "bg-orange-100 text-orange-600",
  sjt: "bg-teal-100 text-teal-600",
  attention: "bg-red-100 text-red-600",
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PsychometricPage() {
  const [phase, setPhase] = useState<Phase>("selection")
  const [activeTestId, setActiveTestId] = useState("")
  const [questions, setQuestions] = useState<Question[]>([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [testLog, setTestLog] = useState<TestSession[]>([])
  const [loadingError, setLoadingError] = useState("")
  const [activeTab, setActiveTab] = useState<"tests" | "history" | "stats">("tests")

  // Load test log from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setTestLog(JSON.parse(stored))
    } catch {}
  }, [])

  const saveSession = (session: TestSession) => {
    const updated = [session, ...testLog]
    setTestLog(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  // Timer
  useEffect(() => {
    if (phase !== "active" || showExplanation || questions.length === 0) return
    const q = questions[questionIndex]
    setTimeLeft(q.timeLimit)
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          handleTimeOut()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [questionIndex, phase, showExplanation])

  const handleTimeOut = () => {
    if (selected !== null) return
    const q = questions[questionIndex]
    const record: AnswerRecord = {
      questionId: q.id,
      question: q.question,
      selected: -1,
      correct: q.correct,
      isCorrect: false,
      timeTaken: q.timeLimit,
      explanation: q.explanation,
      options: q.options,
    }
    proceedAfterAnswer(record)
  }

  const loadQuestions = async (testId: string) => {
    setPhase("loading")
    setLoadingError("")
    try {
      // Get previously asked questions for this test type to avoid repeats
      const prevQuestions = testLog
        .filter(s => s.testType === testId)
        .flatMap(s => s.answers.map(a => a.question))
        .slice(0, 40)

      const res = await fetch("/api/ai/psychometric-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: testId,
          difficulty: "medium",
          count: 20,
          previousQuestions: prevQuestions,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.questions?.length) throw new Error(data.error || "Failed to load questions")

      setQuestions(data.questions)
      setQuestionIndex(0)
      setAnswers([])
      setSelected(null)
      setShowExplanation(false)
      setQuestionStartTime(Date.now())
      setPhase("active")
    } catch (err: any) {
      setLoadingError(err.message || "Failed to generate questions. Please try again.")
      setPhase("selection")
    }
  }

  const handleStartTest = (testId: string) => {
    setActiveTestId(testId)
    loadQuestions(testId)
  }

  const handleSelectAnswer = (index: number) => {
    if (selected !== null || showExplanation) return
    setSelected(index)
    const q = questions[questionIndex]
    const isCorrect = index === q.correct
    const timeTaken = Math.round((Date.now() - questionStartTime) / 1000)
    const record: AnswerRecord = {
      questionId: q.id,
      question: q.question,
      selected: index,
      correct: q.correct,
      isCorrect,
      timeTaken,
      explanation: q.explanation,
      options: q.options,
    }
    proceedAfterAnswer(record)
  }

  const proceedAfterAnswer = (record: AnswerRecord) => {
    const newAnswers = [...answers, record]
    setAnswers(newAnswers)
    setShowExplanation(true)
    setTimeout(() => {
      setShowExplanation(false)
      setSelected(null)
      if (questionIndex < questions.length - 1) {
        setQuestionIndex(prev => prev + 1)
        setQuestionStartTime(Date.now())
      } else {
        // Test complete
        const score = Math.round((newAnswers.filter(a => a.isCorrect).length / newAnswers.length) * 100)
        const avgTime = Math.round(newAnswers.reduce((sum, a) => sum + a.timeTaken, 0) / newAnswers.length)
        const testName = psychometricTests.find(t => t.id === activeTestId)?.name || activeTestId
        const session: TestSession = {
          id: `session-${Date.now()}`,
          testType: activeTestId,
          testName,
          date: new Date().toISOString(),
          score,
          correct: newAnswers.filter(a => a.isCorrect).length,
          total: newAnswers.length,
          avgTime,
          answers: newAnswers,
        }
        saveSession(session)
        setPhase("results")
      }
    }, 2500)
  }

  // ─── Stats calculations ────────────────────────────────────────────────────

  const overallScore = testLog.length > 0
    ? Math.round(testLog.reduce((sum, s) => sum + s.score, 0) / testLog.length)
    : null

  const scoreByType = psychometricTests.map(t => {
    const sessions = testLog.filter(s => s.testType === t.id)
    const avg = sessions.length > 0
      ? Math.round(sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length)
      : null
    return { id: t.id, name: t.name, avg, count: sessions.length }
  })

  const lastSessionByType = (typeId: string) => testLog.find(s => s.testType === typeId)

  const currentSession = testLog[0]
  const currentQ = questions[questionIndex]

  // ─── Loading screen ───────────────────────────────────────────────────────

  if (phase === "loading") {
    const testName = psychometricTests.find(t => t.id === activeTestId)?.name
    return (
      <div className="flex flex-col min-h-full">
        <Topbar title="Psychometric Tests" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-ink mb-2">Generating 20 Questions</h3>
            <p className="text-sm text-ink-muted">Creating unique {testName} questions with Claude AI...</p>
            <p className="text-xs text-ink-faint mt-2">Questions are tailored to avoid repeating what you've seen before</p>
          </div>
        </div>
      </div>
    )
  }

  // ─── Active test ──────────────────────────────────────────────────────────

  if (phase === "active" && currentQ) {
    const progress = ((questionIndex) / questions.length) * 100
    const timerPct = (timeLeft / currentQ.timeLimit) * 100

    return (
      <div className="flex flex-col min-h-full">
        <Topbar title={psychometricTests.find(t => t.id === activeTestId)?.name || "Practice Test"} />
        <div className="flex-1 p-6">
          <div className="max-w-2xl mx-auto space-y-4">

            {/* Progress bar */}
            <div className="flex items-center justify-between text-sm text-ink-muted mb-1">
              <span>Question {questionIndex + 1} of {questions.length}</span>
              <span className={cn("font-semibold tabular-nums", timeLeft <= 15 ? "text-red-500" : "text-ink-muted")}>
                {timeLeft}s
              </span>
            </div>
            <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <div className="h-1 bg-surface-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-1000", timerPct > 50 ? "bg-green-500" : timerPct > 25 ? "bg-amber-500" : "bg-red-500")}
                style={{ width: `${timerPct}%` }}
              />
            </div>

            {/* Passage (verbal) */}
            {currentQ.passage && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                <p className="text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wide">Read the following passage</p>
                <p className="text-sm text-ink leading-relaxed">{currentQ.passage}</p>
              </div>
            )}

            {/* Question */}
            <div className="bg-white rounded-2xl border border-surface-border p-6">
              <p className="text-sm font-semibold text-ink-muted mb-3">
                {currentQ.type.charAt(0).toUpperCase() + currentQ.type.slice(1)} · {currentQ.difficulty}
              </p>
              <p className="text-base font-medium text-ink leading-relaxed mb-6">{currentQ.question}</p>

              <div className="space-y-3">
                {currentQ.options.map((opt, i) => {
                  const isSelected = selected === i
                  const isCorrect = i === currentQ.correct
                  let style = "border-surface-border bg-white hover:border-blue-300 hover:bg-blue-50 cursor-pointer"
                  if (showExplanation) {
                    if (isCorrect) style = "border-green-400 bg-green-50"
                    else if (isSelected && !isCorrect) style = "border-red-400 bg-red-50"
                    else style = "border-surface-border bg-surface-muted opacity-60"
                  } else if (isSelected) {
                    style = "border-blue-500 bg-blue-50"
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => handleSelectAnswer(i)}
                      disabled={showExplanation || selected !== null}
                      className={cn("w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3", style)}
                    >
                      <span className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0",
                        showExplanation && isCorrect ? "bg-green-500 text-white" :
                        showExplanation && isSelected && !isCorrect ? "bg-red-500 text-white" :
                        "bg-surface-muted text-ink-muted"
                      )}>
                        {["A", "B", "C", "D"][i]}
                      </span>
                      <span className="text-sm text-ink">{opt}</span>
                      {showExplanation && isCorrect && <CheckCircle className="w-4 h-4 text-green-500 ml-auto flex-shrink-0" />}
                      {showExplanation && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-500 ml-auto flex-shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Explanation */}
            {showExplanation && (
              <div className={cn(
                "rounded-2xl border p-4 text-sm",
                selected === currentQ.correct || selected === -1
                  ? selected === currentQ.correct ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                  : "bg-red-50 border-red-200"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  {selected === currentQ.correct
                    ? <><CheckCircle className="w-4 h-4 text-green-600" /><span className="font-semibold text-green-800">Correct!</span></>
                    : <><XCircle className="w-4 h-4 text-red-600" /><span className="font-semibold text-red-800">{selected === -1 ? "Time's up!" : "Incorrect"}</span></>
                  }
                </div>
                <p className="text-ink">{currentQ.explanation}</p>
                <p className="text-xs text-ink-faint mt-2">Next question in a moment...</p>
              </div>
            )}

            {/* Score tracker */}
            <div className="flex items-center justify-between text-xs text-ink-faint px-1">
              <span>{answers.filter(a => a.isCorrect).length} correct so far</span>
              <span>{answers.filter(a => !a.isCorrect && a.selected !== -1).length} incorrect · {answers.filter(a => a.selected === -1).length} timed out</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Results screen ───────────────────────────────────────────────────────

  if (phase === "results" && currentSession) {
    const weakAreas = currentSession.answers.filter(a => !a.isCorrect)
    const strongAreas = currentSession.answers.filter(a => a.isCorrect)

    return (
      <div className="flex flex-col min-h-full">
        <Topbar title="Test Results" />
        <div className="flex-1 p-6 space-y-5 max-w-3xl mx-auto w-full">

          {/* Score banner */}
          <div className="bg-gradient-to-r from-[#0a0f1e] to-[#1e293b] rounded-2xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">Test Complete!</h2>
                <p className="text-ink-faint text-sm">{currentSession.testName} · {currentSession.total} questions</p>
                <p className="text-xs text-ink-muted mt-1">{new Date(currentSession.date).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <div className={cn("text-6xl font-bold", getScoreColor(currentSession.score))}>{currentSession.score}</div>
                <div className="text-ink-faint text-sm">/100</div>
                <div className={cn("text-sm font-semibold mt-1", getScoreColor(currentSession.score))}>{getScoreLabel(currentSession.score)}</div>
              </div>
            </div>
            <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full transition-all", getScoreBg(currentSession.score))} style={{ width: `${currentSession.score}%` }} />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-surface-border p-5 text-center">
              <Trophy className="w-7 h-7 text-amber-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-ink">{currentSession.correct}/{currentSession.total}</p>
              <p className="text-xs text-ink-muted mt-1">Correct</p>
            </div>
            <div className="bg-white rounded-2xl border border-surface-border p-5 text-center">
              <Clock className="w-7 h-7 text-blue-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-ink">{currentSession.avgTime}s</p>
              <p className="text-xs text-ink-muted mt-1">Avg per question</p>
            </div>
            <div className="bg-white rounded-2xl border border-surface-border p-5 text-center">
              <TrendingUp className="w-7 h-7 text-purple-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-ink">{Math.min(99, Math.round(currentSession.score * 0.9 + 5))}th</p>
              <p className="text-xs text-ink-muted mt-1">Percentile est.</p>
            </div>
          </div>

          {/* Answer review */}
          <div className="bg-white rounded-2xl border border-surface-border p-6">
            <h3 className="text-sm font-semibold text-ink mb-4">Full Answer Review</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {currentSession.answers.map((a, i) => (
                <div key={i} className={cn("p-4 rounded-xl border", a.isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200")}>
                  <div className="flex items-start gap-3">
                    {a.isCorrect
                      ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      : <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{i + 1}. {a.question}</p>
                      <p className="text-xs text-ink-muted mt-1">
                        Your answer: <strong>{a.selected >= 0 ? a.options[a.selected] : "Timed out"}</strong>
                        {!a.isCorrect && <> · Correct: <strong className="text-green-700">{a.options[a.correct]}</strong></>}
                        <span className="ml-2 text-ink-faint">({a.timeTaken}s)</span>
                      </p>
                      {!a.isCorrect && <p className="text-xs text-ink-muted mt-1.5 leading-relaxed">{a.explanation}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => handleStartTest(activeTestId)}
              className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
            >
              <Zap className="w-4 h-4" /> Generate 20 New Questions
            </button>
            <button
              onClick={() => { setPhase("selection"); setActiveTab("tests") }}
              className="flex items-center gap-2 px-5 py-3 bg-surface-muted text-ink rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Try Different Test
            </button>
            <button
              onClick={() => { setPhase("selection"); setActiveTab("history") }}
              className="flex items-center gap-2 px-5 py-3 bg-surface-muted text-ink rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
            >
              <History className="w-4 h-4" /> View Test Log
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Selection screen ─────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-full">
      <Topbar title="Psychometric Test Practice" />
      <div className="flex-1 p-6 space-y-6">

        {/* Overall score banner */}
        <div className="bg-gradient-to-r from-[#0a0f1e] to-[#1e293b] rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-ink-faint uppercase tracking-wide mb-1">Overall Psychometric Score</p>
              {overallScore !== null ? (
                <>
                  <p className={cn("text-5xl font-bold", getScoreColor(overallScore))}>{overallScore}</p>
                  <p className="text-ink-faint text-sm mt-1">
                    Across {testLog.length} test{testLog.length !== 1 ? "s" : ""} · {testLog.reduce((s, t) => s + t.total, 0)} total questions answered
                  </p>
                </>
              ) : (
                <>
                  <p className="text-4xl font-bold text-ink-faint">—</p>
                  <p className="text-ink-muted text-sm mt-1">Complete your first test to get a score</p>
                </>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {scoreByType.filter(t => t.count > 0).slice(0, 4).map(t => (
                <div key={t.id} className="text-center bg-white/5 rounded-xl px-3 py-2">
                  <p className={cn("text-lg font-bold", getScoreColor(t.avg!))}>{t.avg}</p>
                  <p className="text-xs text-ink-faint">{t.name.split(" ")[0]}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {loadingError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-800">{loadingError}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-muted rounded-xl p-1 w-fit">
          {(["tests", "history", "stats"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize",
                activeTab === tab ? "bg-white text-ink shadow-sm" : "text-ink-muted hover:text-ink"
              )}
            >
              {tab === "tests" ? "Choose Test" : tab === "history" ? `Test Log (${testLog.length})` : "Stats"}
            </button>
          ))}
        </div>

        {/* TESTS TAB */}
        {activeTab === "tests" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {psychometricTests.map(test => {
              const last = lastSessionByType(test.id)
              const sessions = testLog.filter(s => s.testType === test.id)
              const avgScore = sessions.length > 0
                ? Math.round(sessions.reduce((s, t) => s + t.score, 0) / sessions.length)
                : null
              return (
                <div key={test.id} className="bg-white rounded-2xl border border-surface-border p-6 flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", testColors[test.id])}>
                      {iconMap[test.icon] || <Brain className="w-6 h-6" />}
                    </div>
                    {avgScore !== null && (
                      <div className="text-right">
                        <span className={cn("text-sm font-bold", getScoreColor(avgScore))}>{avgScore}/100</span>
                        <p className="text-xs text-ink-faint">{sessions.length} attempt{sessions.length !== 1 ? "s" : ""}</p>
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-ink mb-1">{test.name}</h3>
                  <p className="text-xs text-ink-muted mb-1">{test.description}</p>
                  {last && (
                    <p className="text-xs text-ink-faint mb-3">
                      Last: {last.correct}/{last.total} correct · {new Date(last.date).toLocaleDateString()}
                    </p>
                  )}
                  <div className="mt-auto">
                    {last && (
                      <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden mb-3">
                        <div className={cn("h-full rounded-full", getScoreBg(last.score))} style={{ width: `${last.score}%` }} />
                      </div>
                    )}
                    <button
                      onClick={() => handleStartTest(test.id)}
                      className="w-full py-2.5 rounded-xl font-medium text-sm bg-blue-600 text-white hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      {last ? "Practice Again (20 new Qs)" : "Start Practice (20 Qs)"}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === "history" && (
          <div className="space-y-4">
            {testLog.length === 0 ? (
              <div className="bg-white rounded-2xl border border-surface-border p-12 text-center">
                <History className="w-10 h-10 text-ink-faint mx-auto mb-3" />
                <p className="text-ink-muted font-medium">No tests completed yet</p>
                <p className="text-sm text-ink-faint mt-1">Complete a test to see your history here</p>
              </div>
            ) : (
              testLog.map((session, i) => (
                <div key={session.id} className="bg-white rounded-2xl border border-surface-border p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-sm",
                        testColors[session.testType] || "bg-surface-muted text-ink-muted"
                      )}>
                        {iconMap[psychometricTests.find(t => t.id === session.testType)?.icon || "brain"] || <Brain className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ink">{session.testName}</p>
                        <p className="text-xs text-ink-faint">{new Date(session.date).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-2xl font-bold", getScoreColor(session.score))}>{session.score}</p>
                      <p className="text-xs text-ink-faint">/100</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden mb-3">
                    <div className={cn("h-full rounded-full", getScoreBg(session.score))} style={{ width: `${session.score}%` }} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-ink-muted">
                    <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" />{session.correct}/{session.total} correct</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-blue-500" />{session.avgTime}s avg</span>
                    <span className="flex items-center gap-1"><Target className="w-3 h-3 text-purple-500" />{getScoreLabel(session.score)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* STATS TAB */}
        {activeTab === "stats" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-surface-border p-5 text-center">
                <Trophy className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-ink">{testLog.length}</p>
                <p className="text-xs text-ink-muted">Tests Completed</p>
              </div>
              <div className="bg-white rounded-2xl border border-surface-border p-5 text-center">
                <Target className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-ink">{testLog.reduce((s, t) => s + t.total, 0)}</p>
                <p className="text-xs text-ink-muted">Questions Answered</p>
              </div>
              <div className="bg-white rounded-2xl border border-surface-border p-5 text-center">
                <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-ink">{testLog.reduce((s, t) => s + t.correct, 0)}</p>
                <p className="text-xs text-ink-muted">Correct Answers</p>
              </div>
              <div className="bg-white rounded-2xl border border-surface-border p-5 text-center">
                <TrendingUp className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                <p className={cn("text-2xl font-bold", overallScore ? getScoreColor(overallScore) : "text-ink-faint")}>
                  {overallScore ?? "—"}
                </p>
                <p className="text-xs text-ink-muted">Overall Score</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-surface-border p-6">
              <h3 className="text-sm font-semibold text-ink mb-4">Score by Test Type</h3>
              <div className="space-y-4">
                {scoreByType.map(t => (
                  <div key={t.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-ink">{t.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-ink-faint">{t.count} attempt{t.count !== 1 ? "s" : ""}</span>
                        <span className={cn("text-sm font-bold", t.avg ? getScoreColor(t.avg) : "text-ink-faint")}>
                          {t.avg ?? "—"}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-surface-muted rounded-full overflow-hidden">
                      {t.avg !== null && (
                        <div className={cn("h-full rounded-full transition-all duration-700", getScoreBg(t.avg))} style={{ width: `${t.avg}%` }} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

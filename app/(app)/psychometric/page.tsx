"use client"
import { savePsychScore } from "@/lib/scores"
import { readLocal, DATA_SYNCED_EVENT } from "@/lib/db/local"
import { useState, useEffect, useCallback, useRef } from "react"
import { Topbar } from "@/components/layout/topbar"
import { postAI } from "@/lib/ai/request"
import { psychometricTests } from "@/lib/mock-data"
import { cn, getScoreColor, getScoreLabel, getScoreBg } from "@/lib/utils"
import {
  Calculator, BookOpen, Brain, Shapes, Scale, Eye,
  Play, RotateCcw, Trophy, Clock, CheckCircle, XCircle,
  Loader2, TrendingUp, BarChart3, History, ChevronRight,
  AlertCircle, Zap, Target
} from "lucide-react"
import { ShapeFigure, ShapeSequence, type Shape } from "@/components/psychometric/shape-figure"

// ─── Types ──────────────────────────────────────────────────────────────────

interface Question {
  id: string
  type: string
  difficulty: string
  passage?: string
  question: string
  options: string[]
  /** Indices of the correct options. One for most questions, two for "select two". */
  correct: number | number[]
  /** How many options the candidate must pick. Defaults to 1. */
  selectCount?: number
  /** Abstract reasoning only: the drawn sequence, and a figure per option. */
  sequence?: Shape[][]
  optionShapes?: Shape[][]
  explanation: string
  timeLimit: number
}

interface AnswerRecord {
  questionId: string
  question: string
  selected: number[]
  correct: number[]
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


const iconMap: Record<string, React.ReactNode> = {
  calculator: <Calculator className="w-6 h-6" />,
  book: <BookOpen className="w-6 h-6" />,
  brain: <Brain className="w-6 h-6" />,
  shapes: <Shapes className="w-6 h-6" />,
  scale: <Scale className="w-6 h-6" />,
  eye: <Eye className="w-6 h-6" />,
}

const testColorStyles: Record<string, { bg: string; color: string }> = {
  numerical: { bg: "rgba(91,140,255,0.15)", color: "#5B8CFF" },
  verbal: { bg: "rgba(139,92,246,0.15)", color: "#A78BFA" },
  logical: { bg: "rgba(52,211,153,0.15)", color: "#34D399" },
  abstract: { bg: "rgba(251,191,36,0.12)", color: "#FBBF24" },
  sjt: { bg: "rgba(34,211,238,0.12)", color: "#22D3EE" },
  attention: { bg: "rgba(244,114,182,0.12)", color: "#F472B6" },
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PsychometricPage() {
  const [phase, setPhase] = useState<Phase>("selection")
  const [activeTestId, setActiveTestId] = useState("")
  const [questions, setQuestions] = useState<Question[]>([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  // What the candidate has picked for the current question. A list, because a
  // question may ask for two.
  const [picked, setPicked] = useState<number[]>([])
  // Read inside the navigation guard, which is bound once per phase.
  const answersRef = useRef<AnswerRecord[]>([])
  const [loadElapsed, setLoadElapsed] = useState(0)
  const [showExplanation, setShowExplanation] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [testLog, setTestLog] = useState<TestSession[]>([])
  const [loadingError, setLoadingError] = useState("")
  const [activeTab, setActiveTab] = useState<"tests" | "history" | "stats">("tests")

  // Load test log from the synced cache (hydrated from the user's account)
  useEffect(() => {
    const read = () => setTestLog(readLocal<TestSession[]>("gradprocess_psych_log", []))
    read()
    window.addEventListener(DATA_SYNCED_EVENT, read)
    return () => window.removeEventListener(DATA_SYNCED_EVENT, read)
  }, [])

  const saveSession = (session: TestSession) => {
    setTestLog(prev => [session, ...prev])
    savePsychScore({ ...session, score: session.score, date: session.date, testName: session.testName })
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

  // Leaving mid-test used to discard everything silently — no warning, and no
  // record of the questions already answered.
  useEffect(() => {
    if (phase !== "active") return
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", warn)

    // beforeunload only covers closing or reloading the tab. Clicking away in
    // the sidebar is the likelier way to lose a test, and the router does not
    // fire it, so links are intercepted here too.
    const intercept = (e: MouseEvent) => {
      const link = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null
      if (!link) return
      const href = link.getAttribute("href") || ""
      if (!href.startsWith("/") || href.startsWith("/psychometric")) return
      const answered = answersRef.current.length
      const ok = window.confirm(
        answered > 0
          ? `You are ${answered} question${answered === 1 ? "" : "s"} into this test. Leaving now discards it — the test is only recorded once you finish. Leave anyway?`
          : "Leaving now discards this test. Leave anyway?"
      )
      if (!ok) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    document.addEventListener("click", intercept, true)

    return () => {
      window.removeEventListener("beforeunload", warn)
      document.removeEventListener("click", intercept, true)
    }
  }, [phase])

  // Drives the progress bar on the loading screen.
  useEffect(() => {
    if (phase !== "loading") { setLoadElapsed(0); return }
    const started = Date.now()
    const id = setInterval(() => setLoadElapsed(Math.round((Date.now() - started) / 1000)), 500)
    return () => clearInterval(id)
  }, [phase])

  const handleTimeOut = () => {
    if (showExplanation) return
    const q = questions[questionIndex]
    const record: AnswerRecord = {
      questionId: q.id,
      question: q.question,
      selected: [],
      correct: correctFor(q),
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

      // Generating 20 questions is the slowest call in the product, so it gets
      // a longer ceiling than the shared default — but it must still end.
      const data = await postAI<{ questions?: unknown[] }>(
        "/api/ai/psychometric-quiz",
        {
          type: testId,
          difficulty: "medium",
          count: 20,
          previousQuestions: prevQuestions,
        },
        { timeoutMs: 60_000 }
      )
      if (!data.questions?.length) throw new Error("No questions were returned. Please try again.")

      setQuestions(data.questions as typeof questions)
      setQuestionIndex(0)
      setAnswers([])
      setPicked([])
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

  /** A question's answers, always as a list, whatever shape the model returned. */
  const correctFor = (q: Question): number[] =>
    Array.isArray(q.correct) ? q.correct : [q.correct]

  const requiredFor = (q: Question): number =>
    q.selectCount && q.selectCount > 0 ? q.selectCount : correctFor(q).length || 1

  const submitAnswer = (q: Question, picked: number[]) => {
    const answer = correctFor(q)
    // Every right option and no wrong ones.
    const isCorrect =
      picked.length === answer.length && picked.every(i => answer.includes(i))
    const timeTaken = Math.round((Date.now() - questionStartTime) / 1000)
    proceedAfterAnswer({
      questionId: q.id,
      question: q.question,
      selected: picked,
      correct: answer,
      isCorrect,
      timeTaken,
      explanation: q.explanation,
      options: q.options,
    })
  }

  const handleSelectAnswer = (index: number) => {
    if (showExplanation) return
    const q = questions[questionIndex]
    const required = requiredFor(q)

    // Single-answer questions submit on the click, as before. A "select two"
    // question could not be answered at all previously: the first click locked
    // the selection and submitted a one-item answer against a two-item key.
    if (required === 1) {
      if (picked.length > 0) return
      setPicked([index])
      submitAnswer(q, [index])
      return
    }

    setPicked(prev => {
      const next = prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
      if (next.length > required) return prev
      if (next.length === required) submitAnswer(q, next)
      return next
    })
  }

  const proceedAfterAnswer = (record: AnswerRecord) => {
    const newAnswers = [...answers, record]
    setAnswers(newAnswers)
    answersRef.current = newAnswers
    setShowExplanation(true)
    setTimeout(() => {
      setShowExplanation(false)
      setPicked([])
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

  // Derived from the user's own completed sessions, so it is always a real
  // number they earned rather than a comparison we cannot actually make.
  const sameTestScores = testLog
    .filter(s => s.testType === currentSession?.testType)
    .map(s => s.score)
  const bestScoreForTest = sameTestScores.length ? Math.max(...sameTestScores) : 0
  const isPersonalBest = !!currentSession && currentSession.score >= bestScoreForTest && sameTestScores.length > 1
  const currentQ = questions[questionIndex]

  // ─── Loading screen ───────────────────────────────────────────────────────

  if (phase === "loading") {
    const testName = psychometricTests.find(t => t.id === activeTestId)?.name
    // Generation measures 20-35s. A spinner with fixed text gives no sense that
    // anything is happening, so the bar tracks real elapsed time against that
    // measured range and the caption says which stage it is at.
    const pct = Math.min(96, Math.round((loadElapsed / 28) * 100))
    const stage =
      loadElapsed < 4 ? "Setting up your test"
      : loadElapsed < 12 ? `Writing your ${testName} questions`
      : loadElapsed < 22 ? "Working through the answers and explanations"
      : "Almost there — checking each question"
    return (
      <div className="flex flex-col min-h-full">
        <Topbar title="Psychometric Tests" />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center w-full max-w-sm">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: "rgba(91,140,255,0.12)" }}>
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#5B8CFF" }} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Building your test</h3>
            <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.65)" }}>{stage}…</p>

            <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: "linear-gradient(90deg,#5B8CFF,#8B5CF6)" }} />
            </div>
            <p className="text-xs tabular-nums" style={{ color: "rgba(255,255,255,0.52)" }}>
              {loadElapsed}s · usually takes about 25 seconds
            </p>
            <p className="text-xs mt-4" style={{ color: "rgba(255,255,255,0.52)" }}>
              20 fresh questions, chosen to avoid repeating what you have already seen
            </p>
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
            <div className="flex items-center justify-between text-sm mb-1" style={{ color: "rgba(255,255,255,0.65)" }}>
              <span>Question {questionIndex + 1} of {questions.length}</span>
              <span className={cn("font-semibold tabular-nums", timeLeft <= 15 ? "text-red-400" : "")}
                style={timeLeft > 15 ? { color: "rgba(255,255,255,0.65)" } : {}}>
                {timeLeft}s
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: "#5B8CFF" }} />
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${timerPct}%`,
                  background: timerPct > 50 ? "#34D399" : timerPct > 25 ? "#FBBF24" : "#F87171",
                }}
              />
            </div>

            {/* Passage (verbal) */}
            {currentQ.passage && (
              <div className="rounded-2xl p-5" style={{ background: "rgba(91,140,255,0.08)", border: "1px solid rgba(91,140,255,0.2)" }}>
                <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "#5B8CFF" }}>Read the following passage</p>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{currentQ.passage}</p>
              </div>
            )}

            {/* Question */}
            <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-sm font-semibold mb-3" style={{ color: "rgba(255,255,255,0.62)" }}>
                {currentQ.type.charAt(0).toUpperCase() + currentQ.type.slice(1)} · {currentQ.difficulty}
              </p>
              <p className="text-base font-medium leading-relaxed mb-3 text-white">{currentQ.question}</p>
              {currentQ.sequence && currentQ.sequence.length > 0 && (
                <div className="mb-6 p-4 rounded-xl overflow-x-auto"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <ShapeSequence cells={currentQ.sequence} />
                </div>
              )}

              {requiredFor(currentQ) > 1 && (
                <p className="text-xs font-semibold mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg"
                  style={{ background: "rgba(91,140,255,0.12)", color: "#8FB4FF", border: "1px solid rgba(91,140,255,0.3)" }}>
                  Select {requiredFor(currentQ)} answers · {picked.length} of {requiredFor(currentQ)} chosen
                </p>
              )}

              <div className="space-y-3">
                {currentQ.options.map((opt, i) => {
                  const isSelected = picked.includes(i)
                  const isCorrect = correctFor(currentQ).includes(i)
                  let bgStyle: React.CSSProperties = { background: "rgba(255,255,255,0.04)", border: "2px solid rgba(255,255,255,0.08)", cursor: "pointer" }
                  if (showExplanation) {
                    if (isCorrect) bgStyle = { background: "rgba(52,211,153,0.1)", border: "2px solid rgba(52,211,153,0.4)" }
                    else if (isSelected && !isCorrect) bgStyle = { background: "rgba(248,113,113,0.1)", border: "2px solid rgba(248,113,113,0.4)" }
                    else bgStyle = { background: "rgba(255,255,255,0.02)", border: "2px solid rgba(255,255,255,0.06)", opacity: 0.6 }
                  } else if (isSelected) {
                    bgStyle = { background: "rgba(91,140,255,0.1)", border: "2px solid rgba(91,140,255,0.4)" }
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => handleSelectAnswer(i)}
                      disabled={showExplanation || (requiredFor(currentQ) === 1 && picked.length > 0)}
                      className="w-full text-left p-4 rounded-xl transition-all flex items-center gap-3"
                      style={bgStyle}
                    >
                      {currentQ.optionShapes?.[i] && (
                        <ShapeFigure shapes={currentQ.optionShapes[i]} size={56} />
                      )}
                      <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={
                          showExplanation && isCorrect ? { background: "#34D399", color: "#ffffff" } :
                          showExplanation && isSelected && !isCorrect ? { background: "#F87171", color: "#ffffff" } :
                          { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.65)" }
                        }>
                        {["A", "B", "C", "D"][i]}
                      </span>
                      <span className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>{opt}</span>
                      {showExplanation && isCorrect && <CheckCircle className="w-4 h-4 ml-auto flex-shrink-0" style={{ color: "#34D399" }} />}
                      {showExplanation && isSelected && !isCorrect && <XCircle className="w-4 h-4 ml-auto flex-shrink-0" style={{ color: "#F87171" }} />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Explanation */}
            {showExplanation && (
              <div className="rounded-2xl border p-4 text-sm"
                style={answers[answers.length - 1]?.isCorrect
                  ? { background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.25)" }
                  : { background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)" }
                }>
                <div className="flex items-center gap-2 mb-2">
                  {answers[answers.length - 1]?.isCorrect
                    ? <><CheckCircle className="w-4 h-4" style={{ color: "#34D399" }} /><span className="font-semibold" style={{ color: "#34D399" }}>Correct!</span></>
                    : <><XCircle className="w-4 h-4" style={{ color: "#F87171" }} /><span className="font-semibold" style={{ color: "#F87171" }}>{answers[answers.length - 1]?.selected.length === 0 ? "Time's up!" : "Incorrect"}</span></>
                  }
                </div>
                <p style={{ color: "rgba(255,255,255,0.65)" }}>{currentQ.explanation}</p>
                <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.62)" }}>Next question in a moment...</p>
              </div>
            )}

            {/* Score tracker */}
            <div className="flex items-center justify-between text-xs px-1" style={{ color: "rgba(255,255,255,0.62)" }}>
              <span>{answers.filter(a => a.isCorrect).length} correct so far</span>
              <span>{answers.filter(a => !a.isCorrect && a.selected.length > 0).length} incorrect · {answers.filter(a => a.selected.length === 0).length} timed out</span>
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
          <div className="rounded-2xl p-8 text-white" style={{ background: "linear-gradient(135deg, #0a0f1e 0%, #1e293b 100%)" }}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">Test Complete!</h2>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>{currentSession.testName} · {currentSession.total} questions</p>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.62)" }}>{new Date(currentSession.date).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <div className={cn("text-6xl font-bold", getScoreColor(currentSession.score))}>{currentSession.score}</div>
                <div className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>/100</div>
                <div className={cn("text-sm font-semibold mt-1", getScoreColor(currentSession.score))}>{getScoreLabel(currentSession.score)}</div>
              </div>
            </div>
            <div className="mt-4 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
              <div className={cn("h-full rounded-full transition-all", getScoreBg(currentSession.score))} style={{ width: `${currentSession.score}%` }} />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl p-5 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Trophy className="w-7 h-7 text-amber-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">{currentSession.correct}/{currentSession.total}</p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>Correct</p>
            </div>
            <div className="rounded-2xl p-5 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Clock className="w-7 h-7 mx-auto mb-2" style={{ color: "#5B8CFF" }} />
              <p className="text-3xl font-bold text-white">{currentSession.avgTime}s</p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>Avg per question</p>
            </div>
            <div className="rounded-2xl p-5 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <TrendingUp className="w-7 h-7 mx-auto mb-2" style={{ color: "#8B5CF6" }} />
              {/* This tile used to read "Percentile est." from
                  score * 0.9 + 5 — the user's own score relabelled as a rank
                  against other graduates. There is no applicant pool to
                  compare against, so it claimed a comparison that did not
                  exist. Their best score on this test type is real. */}
              <p className="text-3xl font-bold text-white">{bestScoreForTest}%</p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>
                {isPersonalBest ? "Your best — new record" : "Your best on this test"}
              </p>
            </div>
          </div>

          {/* Answer review */}
          <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h3 className="text-sm font-semibold text-white mb-4">Full Answer Review</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {currentSession.answers.map((a, i) => (
                <div key={i} className="p-4 rounded-xl"
                  style={a.isCorrect
                    ? { background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)" }
                    : { background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }
                  }>
                  <div className="flex items-start gap-3">
                    {a.isCorrect
                      ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#34D399" }} />
                      : <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#F87171" }} />
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{i + 1}. {a.question}</p>
                      <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>
                        Your answer: <strong>{a.selected.length > 0 ? a.selected.map(i => a.options[i]).join(", ") : "Timed out"}</strong>
                        {!a.isCorrect && <> · Correct: <strong style={{ color: "#34D399" }}>{a.correct.map(i => a.options[i]).join(", ")}</strong></>}
                        <span className="ml-2" style={{ color: "rgba(255,255,255,0.62)" }}>({a.timeTaken}s)</span>
                      </p>
                      {!a.isCorrect && <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{a.explanation}</p>}
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
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white transition-colors hover:opacity-90"
              style={{ background: "#5B8CFF" }}
            >
              <Zap className="w-4 h-4" /> Generate 20 New Questions
            </button>
            <button
              onClick={() => { setPhase("selection"); setActiveTab("tests") }}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-colors"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <RotateCcw className="w-4 h-4" /> Try Different Test
            </button>
            <button
              onClick={() => { setPhase("selection"); setActiveTab("history") }}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-colors"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.1)" }}
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
        <div className="rounded-2xl p-6 text-white" style={{ background: "linear-gradient(135deg, #0a0f1e 0%, #1e293b 100%)" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide mb-1" style={{ color: "rgba(255,255,255,0.62)" }}>Overall Psychometric Score</p>
              {overallScore !== null ? (
                <>
                  <p className={cn("text-5xl font-bold", getScoreColor(overallScore))}>{overallScore}</p>
                  <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Across {testLog.length} test{testLog.length !== 1 ? "s" : ""} · {testLog.reduce((s, t) => s + t.total, 0)} total questions answered
                  </p>
                </>
              ) : (
                <>
                  <p className="text-4xl font-bold" style={{ color: "rgba(255,255,255,0.62)" }}>—</p>
                  <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>Complete your first test to get a score</p>
                </>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {scoreByType.filter(t => t.count > 0).slice(0, 4).map(t => (
                <div key={t.id} className="text-center rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <p className={cn("text-lg font-bold", getScoreColor(t.avg!))}>{t.avg}</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.62)" }}>{t.name.split(" ")[0]}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {loadingError && (
          <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
            <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: "#F87171" }} />
            <p className="text-sm" style={{ color: "#F87171" }}>{loadingError}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl p-1 w-fit" style={{ background: "rgba(255,255,255,0.04)" }}>
          {(["tests", "history", "stats"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize"
              style={activeTab === tab
                ? { background: "rgba(255,255,255,0.08)", color: "#ffffff" }
                : { color: "rgba(255,255,255,0.5)" }
              }
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
              const colorStyle = testColorStyles[test.id] || { bg: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.65)" }
              return (
                <div key={test.id} className="rounded-2xl p-6 flex flex-col" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: colorStyle.bg, color: colorStyle.color }}>
                      {iconMap[test.icon] || <Brain className="w-6 h-6" />}
                    </div>
                    {avgScore !== null && (
                      <div className="text-right">
                        <span className={cn("text-sm font-bold", getScoreColor(avgScore))}>{avgScore}/100</span>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.62)" }}>{sessions.length} attempt{sessions.length !== 1 ? "s" : ""}</p>
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-white mb-1">{test.name}</h3>
                  <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.65)" }}>{test.description}</p>
                  {last && (
                    <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.62)" }}>
                      Last: {last.correct}/{last.total} correct · {new Date(last.date).toLocaleDateString()}
                    </p>
                  )}
                  <div className="mt-auto">
                    {last && (
                      <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: "rgba(255,255,255,0.08)" }}>
                        <div className={cn("h-full rounded-full", getScoreBg(last.score))} style={{ width: `${last.score}%` }} />
                      </div>
                    )}
                    <button
                      onClick={() => handleStartTest(test.id)}
                      className="w-full py-2.5 rounded-xl font-medium text-sm text-white transition-all flex items-center justify-center gap-2 hover:opacity-90"
                      style={{ background: "#5B8CFF" }}
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
              <div className="rounded-2xl p-12 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <History className="w-10 h-10 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.2)" }} />
                <p className="font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>No tests completed yet</p>
                <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.62)" }}>Complete a test to see your history here</p>
              </div>
            ) : (
              testLog.map((session, i) => {
                const colorStyle = testColorStyles[session.testType] || { bg: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.65)" }
                return (
                  <div key={session.id} className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm"
                          style={{ background: colorStyle.bg, color: colorStyle.color }}>
                          {iconMap[psychometricTests.find(t => t.id === session.testType)?.icon || "brain"] || <Brain className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{session.testName}</p>
                          <p className="text-xs" style={{ color: "rgba(255,255,255,0.62)" }}>{new Date(session.date).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-2xl font-bold", getScoreColor(session.score))}>{session.score}</p>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.62)" }}>/100</p>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <div className={cn("h-full rounded-full", getScoreBg(session.score))} style={{ width: `${session.score}%` }} />
                    </div>
                    <div className="flex items-center gap-4 text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>
                      <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-400" />{session.correct}/{session.total} correct</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" style={{ color: "#5B8CFF" }} />{session.avgTime}s avg</span>
                      <span className="flex items-center gap-1"><Target className="w-3 h-3" style={{ color: "#8B5CF6" }} />{getScoreLabel(session.score)}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* STATS TAB */}
        {activeTab === "stats" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-2xl p-5 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <Trophy className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{testLog.length}</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>Tests Completed</p>
              </div>
              <div className="rounded-2xl p-5 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <Target className="w-6 h-6 mx-auto mb-2" style={{ color: "#5B8CFF" }} />
                <p className="text-2xl font-bold text-white">{testLog.reduce((s, t) => s + t.total, 0)}</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>Questions Answered</p>
              </div>
              <div className="rounded-2xl p-5 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <CheckCircle className="w-6 h-6 mx-auto mb-2" style={{ color: "#34D399" }} />
                <p className="text-2xl font-bold text-white">{testLog.reduce((s, t) => s + t.correct, 0)}</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>Correct Answers</p>
              </div>
              <div className="rounded-2xl p-5 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <TrendingUp className="w-6 h-6 mx-auto mb-2" style={{ color: "#8B5CF6" }} />
                <p className={cn("text-2xl font-bold", overallScore ? getScoreColor(overallScore) : "")}
                  style={!overallScore ? { color: "rgba(255,255,255,0.62)" } : {}}>
                  {overallScore ?? "—"}
                </p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>Overall Score</p>
              </div>
            </div>

            <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h3 className="text-sm font-semibold text-white mb-4">Score by Test Type</h3>
              <div className="space-y-4">
                {scoreByType.map(t => (
                  <div key={t.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>{t.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: "rgba(255,255,255,0.62)" }}>{t.count} attempt{t.count !== 1 ? "s" : ""}</span>
                        <span className={cn("text-sm font-bold", t.avg ? getScoreColor(t.avg) : "")}
                          style={!t.avg ? { color: "rgba(255,255,255,0.62)" } : {}}>
                          {t.avg ?? "—"}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
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

"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Topbar } from "@/components/layout/topbar"
import { cn } from "@/lib/utils"
import { detectFillerWords, getFillerFeedback } from "@/lib/interview/filler-words"
import { pickAnswerText } from "@/lib/interview/answer-text"
import { createSession, saveSession, addAnswerToSession, finalizeSession, loadSessions } from "@/lib/interview/session-store"
import { saveVideoScore } from "@/lib/scores"
import type { InterviewSetup, InterviewMode, Difficulty, InterviewQuestion, AnswerAnalysis, FinalReport, StoredSession, DeliveryMetrics, Phase } from "@/lib/interview/types"
import {
  Video, Mic, MicOff, VideoOff, Play, Square,
  CheckCircle, AlertCircle, Sparkles, ChevronRight, Timer,
  TrendingUp, MessageSquare, Target, Zap, Info, ArrowRight,
  BarChart3, Trophy, BookOpen, RefreshCw, Clock, Volume2, Download,
} from "lucide-react"

// ─── Constants ───────────────────────────────────────────────────────────────

const SECTORS = ["Consulting", "Investment Banking", "Banking", "Technology", "Asset Management", "Insurance", "Law", "Engineering", "FMCG", "Healthcare", "Energy", "Public Sector"]

const SECTOR_ROLES: Record<string, string[]> = {
  "Consulting": ["Strategy Consultant", "Management Consultant", "Technology Consultant", "Operations Consultant", "Graduate Analyst"],
  "Investment Banking": ["Investment Banking Analyst", "M&A Analyst", "Capital Markets Analyst", "Leveraged Finance Analyst", "Graduate Trainee"],
  "Banking": ["Graduate Analyst", "Retail Banking Trainee", "Corporate Banking Analyst", "Risk Analyst", "Credit Analyst"],
  "Technology": ["Software Engineer", "Product Manager", "Data Analyst", "Business Analyst", "Technology Graduate"],
  "Asset Management": ["Investment Analyst", "Portfolio Analyst", "Risk Analyst", "Quantitative Analyst", "Graduate Trainee"],
  "Insurance": ["Graduate Analyst", "Actuarial Analyst", "Risk Analyst", "Underwriting Analyst", "Claims Analyst"],
  "Law": ["Trainee Solicitor", "Paralegal", "Legal Graduate", "Barrister Pupil", "In-house Legal Trainee"],
  "Engineering": ["Graduate Engineer", "Project Engineer", "Structural Engineer", "Civil Engineer", "Mechanical Engineer"],
  "FMCG": ["Brand Manager", "Marketing Graduate", "Supply Chain Analyst", "Commercial Graduate", "Finance Analyst"],
  "Healthcare": ["Management Trainee", "NHS Graduate Scheme", "Healthcare Analyst", "Clinical Analyst", "Graduate Consultant"],
  "Energy": ["Graduate Engineer", "Energy Analyst", "Project Manager", "Commercial Analyst", "Operations Graduate"],
  "Public Sector": ["Policy Analyst", "Civil Service Fast Stream", "Graduate Administrator", "Research Analyst", "Programme Manager"],
}

const MODES: InterviewMode[] = ["Competency", "Strengths", "Motivational", "Technical", "Commercial", "Situational", "Leadership", "Behavioral", "Mixed"]
const DIFFICULTIES: Difficulty[] = ["Beginner", "Intermediate", "Advanced", "Assessment Centre", "Elite"]

const ACTIVE_STYLE: React.CSSProperties = { borderColor: "rgba(91,140,255,0.5)", backgroundColor: "rgba(91,140,255,0.12)", color: "#5B8CFF" }
const INACTIVE_STYLE: React.CSSProperties = { borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.65)" }

// ─── Score helpers ────────────────────────────────────────────────────────────

function scoreColor(s: number) {
  if (s >= 75) return "text-emerald-400"
  if (s >= 60) return "text-blue-400"
  if (s >= 40) return "text-amber-400"
  return "text-rose-400"
}

function scoreBgStyle(s: number): React.CSSProperties {
  if (s >= 75) return { background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }
  if (s >= 60) return { background: "rgba(91,140,255,0.1)", border: "1px solid rgba(91,140,255,0.2)" }
  if (s >= 40) return { background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)" }
  return { background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)" }
}

function scoreLabel(s: number) {
  if (s >= 75) return "Interview Ready"
  if (s >= 60) return "Strong Foundation"
  if (s >= 40) return "Developing"
  return "Needs Practice"
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, "0")}`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScorePill({ label, score }: { label: string; score: number }) {
  return (
    <div className={cn("rounded-xl px-3 py-2 text-center")} style={scoreBgStyle(score)}>
      <p className="text-xs font-medium mb-0.5" style={{ color: "rgba(255,255,255,0.65)" }}>{label}</p>
      <p className={cn("text-xl font-bold", scoreColor(score))}>{score}</p>
    </div>
  )
}

function StarBadge({ has, label }: { has: boolean; label: string }) {
  return (
    <div className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium")}
      style={has
        ? { background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", color: "#34D399" }
        : { background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", color: "#F87171" }
      }>
      {has ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
      {label}
    </div>
  )
}

// ─── Download helpers ─────────────────────────────────────────────────────────

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

function downloadTextFile(text: string, filename: string, mimeType = "text/plain") {
  downloadBlob(new Blob([text], { type: mimeType }), filename)
}

function makeSlug(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50)
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VideoInterviewPage() {
  // Setup
  const [setup, setSetup] = useState<InterviewSetup>({ sector: "Consulting", role: "Strategy Consultant", mode: "Competency", difficulty: "Intermediate", questionCount: 4 })

  const setSector = (sector: string) => {
    const roles = SECTOR_ROLES[sector] || []
    setSetup(p => ({ ...p, sector, role: roles[0] || p.role }))
  }
  const [phase, setPhase] = useState<Phase>("setup")

  // Questions
  const [questions, setQuestions] = useState<InterviewQuestion[]>([])
  const [qIndex, setQIndex] = useState(0)
  const [generatingQs, setGeneratingQs] = useState(false)

  // Recording
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const [typedAnswer, setTypedAnswer] = useState("")
  const [transcript, setTranscript] = useState("")
  const [liveText, setLiveText] = useState("")
  const [fillerCountLive, setFillerCountLive] = useState(0)
  const [wpmLive, setWpmLive] = useState(0)
  const [liveCoaching, setLiveCoaching] = useState(true)

  // Permissions
  const [hasCamera, setHasCamera] = useState(false)
  const [hasMic, setHasMic] = useState(false)
  const [permError, setPermError] = useState("")
  // Web Speech API is Chrome/Edge-only. Detected on the client so SSR markup matches.
  const [speechSupported, setSpeechSupported] = useState(true)
  const [speechError, setSpeechError] = useState("")

  // Analysis
  const [analyzing, setAnalyzing] = useState(false)
  const [currentAnalysis, setCurrentAnalysis] = useState<AnswerAnalysis | null>(null)
  const [answers, setAnswers] = useState<AnswerAnalysis[]>([])
  const [isFollowUp, setIsFollowUp] = useState(false)

  // Report
  const [finalReport, setFinalReport] = useState<FinalReport | null>(null)
  const [generatingReport, setGeneratingReport] = useState(false)

  // Session
  const [session, setSession] = useState<StoredSession | null>(null)
  const [pastSessions, setPastSessions] = useState<StoredSession[]>([])

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recognitionRef = useRef<any>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const transcriptRef = useRef("")
  const secondsRef = useRef(0)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    setPastSessions(loadSessions())
  }, [])

  // Revoke previous object URL when it changes or on unmount
  useEffect(() => {
    return () => {
      if (recordedUrl) URL.revokeObjectURL(recordedUrl)
    }
  }, [recordedUrl])

  // Detect live-transcription support once mounted (Chrome/Edge only)
  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }
    setSpeechSupported(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition))
  }, [])

  // ── Camera preview (kept running during interview) ──
  useEffect(() => {
    if (phase === "permissions" || phase === "question" || phase === "recording" || phase === "feedback" || phase === "analyzing") {
      if (streamRef.current && videoRef.current) {
        videoRef.current.srcObject = streamRef.current
      }
    }
  }, [phase])

  // ── Permissions ──────────────────────────────────────
  const requestPermissions = async () => {
    setPermError("")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      setHasCamera(true)
      setHasMic(true)
      if (videoRef.current) videoRef.current.srcObject = stream
      setPhase("question")
    } catch (err: any) {
      if (err.name === "NotAllowedError") setPermError("Camera and microphone access denied. Please allow permissions in your browser settings.")
      else setPermError("Could not access camera/microphone. Please check your device.")
    }
  }

  const tryMicOnly = async () => {
    setPermError("")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      setHasMic(true)
      setPhase("question")
    } catch {
      setPermError("Microphone access denied.")
    }
  }

  // ── Generate questions ────────────────────────────────
  const generateQuestions = async () => {
    setGeneratingQs(true)
    try {
      const res = await fetch("/api/ai/interview/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setup }),
      })
      const data = await res.json()
      const qs: InterviewQuestion[] = (data.questions || []).map((q: any, i: number) => ({
        ...q,
        id: q.id || `q${i}`,
        suggestedSeconds: q.suggestedSeconds || 120,
        isFollowUp: false,
      }))
      setQuestions(qs)
      const sess = createSession(setup, qs)
      setSession(sess)
      return qs
    } finally {
      setGeneratingQs(false)
    }
  }

  const handleStartInterview = async () => {
    const qs = await generateQuestions()
    if (qs.length > 0) setPhase("permissions")
  }

  // ── Recording ─────────────────────────────────────────
  const startRecording = useCallback(() => {
    if (!streamRef.current) return
    transcriptRef.current = ""
    secondsRef.current = 0
    setTranscript("")
    setLiveText("")
    setTypedAnswer("")
    setFillerCountLive(0)
    setWpmLive(0)
    setRecordingSeconds(0)
    setIsRecording(true)

    // Clear any previous recording blob
    setRecordedUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null })
    chunksRef.current = []

    // MediaRecorder — collect chunks so we can offer download after stop
    try {
      const mr = new MediaRecorder(streamRef.current)
      mediaRecorderRef.current = mr
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" })
        setRecordedUrl(URL.createObjectURL(blob))
      }
      mr.start()
    } catch {}

    // Timer
    timerRef.current = setInterval(() => {
      secondsRef.current += 1
      setRecordingSeconds(s => s + 1)
      const words = transcriptRef.current.trim().split(/\s+/).filter(Boolean).length
      const mins = Math.max(secondsRef.current / 60, 0.1)
      setWpmLive(Math.round(words / mins))
    }, 1000)

    // SpeechRecognition — Chrome/Edge only. Without it the user still records
    // and can type their answer; the UI says so rather than failing silently.
    setSpeechError("")
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      setSpeechSupported(false)
      setPhase("recording")
      return
    }

    const rec = new SR()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = "en-GB"
    recognitionRef.current = rec

    rec.onresult = (event: any) => {
      let interim = ""
      let finalPart = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) finalPart += t + " "
        else interim += t
      }
      if (finalPart) transcriptRef.current += finalPart
      setTranscript(transcriptRef.current)
      setLiveText(interim)
      const fd = detectFillerWords(transcriptRef.current, secondsRef.current)
      setFillerCountLive(fd.total)
    }

    rec.onerror = (e: { error?: string }) => {
      // "no-speech" and "aborted" are routine; anything else means the
      // transcript will be incomplete, so tell the user to type instead.
      if (e?.error === "no-speech" || e?.error === "aborted") return
      setSpeechError(
        e?.error === "not-allowed"
          ? "Microphone access was blocked, so live transcription is off. Type your answer below to still get feedback."
          : "Live transcription stopped unexpectedly. Type your answer below to still get feedback."
      )
    }
    try { rec.start() } catch {
      setSpeechError("Live transcription could not start. Type your answer below to still get feedback.")
    }

    setPhase("recording")
  }, [])

  const stopRecording = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setIsRecording(false)
    setPhase("analyzing")

    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop()
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
    }

    const finalTranscript = pickAnswerText(transcriptRef.current + liveText, typedAnswer)
    const duration = secondsRef.current
    const words = finalTranscript.trim().split(/\s+/).filter(Boolean).length
    const wpm = Math.round(words / Math.max(duration / 60, 0.1))

    const fillerData = detectFillerWords(finalTranscript, duration)
    const deliveryData: DeliveryMetrics = {
      wordsPerMinute: wpm,
      durationSeconds: duration,
      wordCount: words,
      pauseCount: 0,
      pacing: wpm < 90 ? "too slow" : wpm > 160 ? "too fast" : "good",
    }

    const currentQ = isFollowUp && currentAnalysis?.followUpQuestion
      ? { ...questions[qIndex], text: currentAnalysis.followUpQuestion, isFollowUp: true }
      : questions[qIndex]

    setAnalyzing(true)
    try {
      const res = await fetch("/api/ai/interview/analyze-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQ,
          transcript: finalTranscript,
          setup,
          fillerData,
          deliveryData,
        }),
      })
      const analysis = await res.json()
      const full: AnswerAnalysis = {
        questionId: currentQ.id,
        questionText: currentQ.text,
        transcript: finalTranscript,
        durationSeconds: duration,
        fillerWords: fillerData,
        star: analysis.star || { hasSituation: false, hasTask: false, hasAction: false, hasResult: false, situationScore: 0, taskScore: 0, actionScore: 0, resultScore: 0, hasQuantifiedResult: false, hasOwnership: false, overallScore: 0, feedback: "" },
        delivery: deliveryData,
        contentScore: analysis.contentScore || 0,
        starScore: analysis.starScore || 0,
        deliveryScore: analysis.deliveryScore || 0,
        communicationScore: analysis.communicationScore || 0,
        commercialScore: analysis.commercialScore || 0,
        overallScore: analysis.overallScore || 0,
        strengths: analysis.strengths || [],
        improvements: analysis.improvements || [],
        idealAnswer: analysis.idealAnswer || "",
        followUpQuestion: analysis.followUpQuestion || null,
        followUpReason: analysis.followUpReason || null,
      }
      setCurrentAnalysis(full)
      const newAnswers = [...answers, full]
      setAnswers(newAnswers)
      if (session) {
        const updated = addAnswerToSession(session, full)
        setSession(updated)
        saveSession(updated)
      }
    } finally {
      setAnalyzing(false)
      setPhase("feedback")
    }
  }, [liveText, typedAnswer, questions, qIndex, setup, answers, session, isFollowUp, currentAnalysis])

  const handleNextQuestion = () => {
    setIsFollowUp(false)
    setCurrentAnalysis(null)
    const next = qIndex + 1
    if (next >= questions.length) {
      handleFinishInterview()
    } else {
      setQIndex(next)
      setPhase("question")
    }
  }

  const handleAnswerFollowUp = () => {
    setIsFollowUp(true)
    setPhase("question")
  }

  const handleFinishInterview = async () => {
    setGeneratingReport(true)
    setPhase("report")
    try {
      const res = await fetch("/api/ai/interview/final-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setup, questions, answers, sessionId: session?.id }),
      })
      const { report } = await res.json()
      setFinalReport(report)
      if (session && report) {
        const finalized = finalizeSession(session, report)
        saveSession(finalized)
        setPastSessions(loadSessions())
      }
      if (report) {
        saveVideoScore({
          score: report.overallScore,
          date: new Date().toISOString(),
          topic: `${setup.sector} ${setup.mode} Interview`,
          sector: setup.sector,
          mode: setup.mode,
          difficulty: setup.difficulty,
          questionCount: answers.length,
          contentScore: report.contentScore,
          starScore: report.starScore,
          deliveryScore: report.deliveryScore,
          commercialScore: report.commercialScore,
          communicationScore: report.communicationScore,
          totalFillerWords: report.totalFillerWords,
          avgWordsPerMinute: report.avgWordsPerMinute,
          durationSeconds: report.totalDurationSeconds,
          strengths: report.strengths,
          improvements: report.improvements,
          sessionId: session?.id,
        })
      }
    } finally {
      setGeneratingReport(false)
    }
  }

  const handleRestart = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setRecordedUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null })
    chunksRef.current = []
    setPhase("setup")
    setQuestions([])
    setQIndex(0)
    setAnswers([])
    setCurrentAnalysis(null)
    setFinalReport(null)
    setSession(null)
    setIsFollowUp(false)
    setTranscript("")
    setLiveText("")
    setTypedAnswer("")
  }

  const handleDownloadVideo = () => {
    if (!recordedUrl) return
    const questionText = currentAnalysis?.questionText ?? questions[qIndex]?.text ?? "question"
    const slug = questionText
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50)
    const date = new Date().toISOString().split("T")[0]
    const a = document.createElement("a")
    a.href = recordedUrl
    a.download = `gradprocess-video-interview-${slug}-${date}.webm`
    a.click()
  }

  const handleDownloadTranscript = () => {
    const questionText = currentAnalysis?.questionText ?? questions[qIndex]?.text ?? "question"
    const responseText = currentAnalysis?.transcript || typedAnswer || "No response recorded."
    const date = new Date().toISOString().split("T")[0]
    const content = [
      "GradProcess AI — Video Interview Response",
      "=".repeat(42),
      "",
      `Date:       ${date}`,
      `Sector:     ${setup.sector}`,
      `Role:       ${setup.role}`,
      `Mode:       ${setup.mode}`,
      `Difficulty: ${setup.difficulty}`,
      "",
      "Question",
      "─".repeat(42),
      questionText,
      "",
      "Your Response",
      "─".repeat(42),
      responseText,
    ].join("\n")
    downloadTextFile(content, `gradprocess-video-interview-${makeSlug(questionText)}-${date}.txt`)
  }

  const handleDownloadHtml = () => {
    const questionText = currentAnalysis?.questionText ?? questions[qIndex]?.text ?? "question"
    const responseText = (currentAnalysis?.transcript || typedAnswer || "No response recorded.").replace(/\n/g, "<br>")
    const date = new Date().toISOString().split("T")[0]
    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>GradProcess AI — Interview Response</title>
<style>body{font-family:system-ui,sans-serif;max-width:680px;margin:48px auto;padding:0 24px;color:#1f2937}h1{font-size:1.1rem;color:#6D5EF3;margin-bottom:4px}h2{font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;color:#9CA3AF;margin:2rem 0 0.5rem}p{line-height:1.7;color:#374151}hr{border:none;border-top:1px solid #E5E7EB;margin:2rem 0}.meta{font-size:0.75rem;color:#9CA3AF}</style>
</head>
<body>
<h1>GradProcess AI — Video Interview Response</h1>
<p class="meta">${date} · ${setup.sector} · ${setup.role} · ${setup.mode} · ${setup.difficulty}</p>
<hr>
<h2>Question</h2><p>${questionText}</p>
<h2>Your Response</h2><p>${responseText}</p>
</body></html>`
    downloadBlob(new Blob([html], { type: "text/html" }), `gradprocess-video-interview-${makeSlug(questionText)}-${date}.html`)
  }

  const mediaRecorderSupported = typeof window !== "undefined" && typeof window.MediaRecorder !== "undefined"

  const currentQ = questions[qIndex]
  const totalQs = questions.length
  const isLastQ = qIndex >= totalQs - 1

  const cardStyle: React.CSSProperties = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }
  const inputStyle: React.CSSProperties = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#ffffff", borderRadius: 12 }

  // ── RENDER ────────────────────────────────────────────

  // ── SETUP ──
  if (phase === "setup") {
    const sectorRoles = SECTOR_ROLES[setup.sector] || []
    return (
      <div className="flex flex-col min-h-full">
        <Topbar title="Video Interview Simulator" />
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* ── Config panel ── */}
              <div className="lg:col-span-2 rounded-2xl overflow-hidden" style={cardStyle}>
                {/* Header */}
                <div className="px-6 pt-6 pb-4 flex items-center gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,#6D5EF3,#5B8DEF)" }}>
                    <Video className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-white">Configure Your Interview</h2>
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>AI-generated questions tailored to your exact sector and role</p>
                  </div>
                </div>

                <div className="px-6 py-5 space-y-5">
                  {/* Sector + Role */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-white mb-1.5">Target Sector</label>
                      <select value={setup.sector} onChange={e => setSector(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                        style={inputStyle}>
                        {SECTORS.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white mb-1.5">Target Role</label>
                      <select value={setup.role} onChange={e => setSetup(p => ({ ...p, role: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                        style={inputStyle}>
                        {sectorRoles.map(r => <option key={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Mode */}
                  <div>
                    <label className="block text-xs font-semibold text-white mb-2">
                      Interview Mode
                      <span className="ml-2 font-normal" style={{ color: "rgba(255,255,255,0.4)" }}>— pick the competency type you want to practise</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {MODES.map(m => (
                        <button key={m} onClick={() => setSetup(p => ({ ...p, mode: m }))}
                          className="py-2.5 px-3 text-xs font-semibold rounded-xl border-2 transition-all text-left"
                          style={setup.mode === m ? ACTIVE_STYLE : INACTIVE_STYLE}>
                          {m}
                          {setup.mode === m && <span className="ml-1">✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label className="block text-xs font-semibold text-white mb-2">Difficulty Level</label>
                    <div className="flex gap-2 flex-wrap">
                      {DIFFICULTIES.map(d => (
                        <button key={d} onClick={() => setSetup(p => ({ ...p, difficulty: d }))}
                          className="py-2 px-4 text-xs font-semibold rounded-xl border-2 transition-all"
                          style={setup.difficulty === d ? ACTIVE_STYLE : INACTIVE_STYLE}>
                          {d}
                          {setup.difficulty === d && " ✓"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Question count */}
                  <div>
                    <label className="block text-xs font-semibold text-white mb-2">
                      Questions: <span style={{ color: "#5B8CFF" }}>{setup.questionCount}</span>
                      <span className="ml-2 font-normal" style={{ color: "rgba(255,255,255,0.4)" }}>({setup.questionCount <= 3 ? "Quick practice" : setup.questionCount <= 5 ? "Standard session" : "Full interview"})</span>
                    </label>
                    <input type="range" min={2} max={8} value={setup.questionCount}
                      onChange={e => setSetup(p => ({ ...p, questionCount: +e.target.value }))}
                      className="w-full" style={{ accentColor: "#5B8CFF" }} />
                    <div className="flex justify-between text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                      <span>2 — Quick</span><span>8 — Full simulation</span>
                    </div>
                  </div>
                </div>

                {/* Start button */}
                <div className="px-6 pb-6">
                  <button onClick={handleStartInterview} disabled={generatingQs}
                    className="w-full py-4 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2"
                    style={{
                      background: generatingQs ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg,#6D5EF3,#5B8DEF)",
                      cursor: generatingQs ? "not-allowed" : "pointer",
                    }}>
                    {generatingQs
                      ? <><RefreshCw className="w-4 h-4 animate-spin" />Generating {setup.questionCount} questions…</>
                      : <><Play className="w-4 h-4" />Start {setup.mode} Interview — {setup.sector}</>
                    }
                  </button>
                  <p className="text-xs text-center mt-3" style={{ color: "rgba(255,255,255,0.4)" }}>
                    You will be asked to grant camera &amp; microphone access on the next screen.
                  </p>
                </div>
              </div>

              {/* ── Sidebar ── */}
              <div className="space-y-4">
                {/* What's included */}
                <div className="rounded-2xl p-5" style={cardStyle}>
                  <h3 className="text-sm font-semibold text-white mb-3">What this session includes</h3>
                  <div className="space-y-2">
                    {[
                      "AI questions tailored to your sector & role",
                      "Live speech transcription",
                      "STAR structure scoring",
                      "Filler word detection & counts",
                      "Delivery & pacing analysis",
                      "Recruiter-style AI feedback",
                      "Adaptive follow-up questions",
                      "Full scored report",
                    ].map(f => (
                      <div key={f} className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>
                        <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#34D399" }} />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent sessions */}
                <div className="rounded-2xl p-5" style={cardStyle}>
                  <h3 className="text-sm font-semibold text-white mb-3">Recent Sessions</h3>
                  {pastSessions.length === 0 ? (
                    <div className="text-center py-4">
                      <Video className="w-7 h-7 mx-auto mb-2" style={{ color: "rgba(255,255,255,0.2)" }} />
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>No sessions yet — complete your first above</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pastSessions.slice(0, 3).map(s => (
                        <div key={s.id} className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-medium text-white">{s.setup.sector} · {s.setup.mode}</span>
                            {s.report && (
                              <span className="text-xs font-bold" style={{ color: s.report.overallScore >= 75 ? "#34D399" : s.report.overallScore >= 60 ? "#5B8CFF" : "#F59E0B" }}>
                                {s.report.overallScore}/100
                              </span>
                            )}
                          </div>
                          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                            {new Date(s.timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · {s.questions.length}Q
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tip */}
                <div className="rounded-2xl p-4" style={{ background: "rgba(91,140,255,0.08)", border: "1px solid rgba(91,140,255,0.2)" }}>
                  <p className="text-xs font-bold text-white mb-1">STAR Framework</p>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
                    <strong style={{ color: "#5B8CFF" }}>S</strong>ituation → <strong style={{ color: "#5B8CFF" }}>T</strong>ask → <strong style={{ color: "#5B8CFF" }}>A</strong>ction → <strong style={{ color: "#5B8CFF" }}>R</strong>esult.
                    Always quantify your Result with numbers or measurable impact.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── PERMISSIONS ──
  if (phase === "permissions") {
    return (
      <div className="flex flex-col min-h-full">
        <Topbar title="Video Interview — Setup" />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl p-8 text-center space-y-6" style={cardStyle}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: "linear-gradient(135deg,#6D5EF3,#5B8DEF)" }}>
              <Mic className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mb-2">Allow Camera & Microphone</h2>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>GradProcess AI needs access to record your responses and transcribe your answers in real-time. Your recordings are processed locally and never stored on external servers.</p>
            </div>

            {permError && (
              <div className="rounded-xl p-3 text-sm text-left" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#F87171" }}>
                {permError}
              </div>
            )}

            <div className="space-y-3">
              <button onClick={requestPermissions}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all flex items-center justify-center gap-2 hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#6D5EF3,#5B8DEF)" }}>
                <Video className="w-4 h-4" />
                Allow Camera & Microphone
              </button>
              <button onClick={tryMicOnly}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
                style={{ color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)" }}>
                <Mic className="w-4 h-4" />
                Microphone Only
              </button>
            </div>

            <div className="flex items-start gap-2 text-left rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
              <Info style={{ color: "#5B8CFF" }} className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>Live transcription uses your browser's built-in speech recognition. Works best in Chrome or Edge.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── QUESTION (ready to record) ──
  if (phase === "question" && currentQ) {
    const displayQ = isFollowUp && currentAnalysis?.followUpQuestion ? currentAnalysis.followUpQuestion : currentQ.text
    return (
      <div className="flex flex-col min-h-full">
        <Topbar title={`Video Interview — Q${qIndex + 1} of ${totalQs}`} />
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-5">
            {/* Progress */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                <motion.div className="h-full rounded-full" style={{ background: "linear-gradient(90deg,#6D5EF3,#5B8DEF)" }}
                  initial={{ width: 0 }} animate={{ width: `${((qIndex) / totalQs) * 100}%` }} transition={{ duration: 0.5 }} />
              </div>
              <span className="text-xs whitespace-nowrap" style={{ color: "rgba(255,255,255,0.4)" }}>{qIndex + 1}/{totalQs}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
              {/* Camera */}
              <div className="lg:col-span-2">
                <div className="relative aspect-[4/3] bg-gray-900 rounded-2xl overflow-hidden">
                  {hasCamera
                    ? <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                        <VideoOff className="w-8 h-8 text-gray-600" />
                        <p className="text-xs text-gray-500">Camera not available</p>
                      </div>
                  }
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs text-white" style={{ background: "rgba(0,0,0,0.5)" }}>
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                    Ready
                  </div>
                </div>
                <div className="mt-3 p-3 rounded-xl" style={cardStyle}>
                  <p className="text-xs font-medium flex items-center gap-1.5 mb-1" style={{ color: "rgba(255,255,255,0.65)" }}>
                    <Clock className="w-3.5 h-3.5" />
                    Suggested: {fmtTime(currentQ.suggestedSeconds)}
                  </p>
                  {isFollowUp
                    ? <p className="text-xs text-amber-400 font-medium">Follow-up question based on your previous answer</p>
                    : <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Take a moment to collect your thoughts, then click Record</p>
                  }
                </div>
              </div>

              {/* Question card */}
              <div className="lg:col-span-3 space-y-4">
                <div className="rounded-2xl p-6" style={cardStyle}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: "rgba(91,140,255,0.15)", color: "#5B8CFF" }}>
                      {isFollowUp ? "Follow-up" : currentQ.type}
                    </span>
                    {!isFollowUp && <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{currentQ.competency}</span>}
                  </div>
                  <p className="text-lg font-semibold text-white leading-relaxed">{displayQ}</p>
                </div>

                {!isFollowUp && (
                  <div className="rounded-xl p-4" style={{ background: "rgba(91,140,255,0.08)", border: "1px solid rgba(91,140,255,0.2)" }}>
                    <p className="text-xs font-semibold mb-1 flex items-center gap-1.5" style={{ color: "#5B8CFF" }}>
                      <Sparkles className="w-3.5 h-3.5" />
                      Ava's Coaching Tip
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{currentQ.hint}</p>
                  </div>
                )}

                {isFollowUp && currentAnalysis?.followUpReason && (
                  <div className="rounded-xl p-4" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: "#FBBF24" }}>Why this follow-up?</p>
                    <p className="text-xs leading-relaxed" style={{ color: "rgba(251,191,36,0.8)" }}>{currentAnalysis.followUpReason}</p>
                  </div>
                )}

                {!speechSupported && mediaRecorderSupported && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 rounded-xl p-3" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#FBBF24" }} />
                      <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
                        <span className="font-semibold" style={{ color: "#FBBF24" }}>Live transcription isn&apos;t supported in this browser.</span>{" "}
                        Recording, scoring and feedback all still work — type your answer below as you speak, or switch to Chrome or Edge for automatic transcription.
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.65)" }}>Your response (type here — used for scoring)</label>
                      <textarea
                        value={typedAnswer}
                        onChange={e => setTypedAnswer(e.target.value)}
                        rows={4}
                        placeholder="Type your answer here…"
                        className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                )}

                {!mediaRecorderSupported && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 rounded-xl p-3" style={{ background: "rgba(91,140,255,0.08)", border: "1px solid rgba(91,140,255,0.2)" }}>
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#5B8CFF" }} />
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>Video recording is unavailable in your browser, but you can still complete and download your response. Type your answer below or speak — AI feedback and transcript download will still work.</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.65)" }}>Your response (optional — type here if mic is unavailable)</label>
                      <textarea
                        value={typedAnswer}
                        onChange={e => setTypedAnswer(e.target.value)}
                        rows={4}
                        placeholder="Type your answer here…"
                        className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={startRecording}
                    className="flex-1 py-3.5 rounded-xl font-semibold text-sm text-white hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg,#6D5EF3,#5B8DEF)" }}>
                    <Mic className="w-4 h-4" />
                    Start Recording
                  </button>
                  {!isFollowUp && (
                    <button onClick={handleNextQuestion}
                      className="px-4 py-3.5 rounded-xl font-medium text-sm transition-all"
                      style={{ color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)" }}>
                      Skip
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Live coaching</span>
                  <button
                    onClick={() => setLiveCoaching(v => !v)}
                    aria-pressed={liveCoaching}
                    style={{ backgroundColor: liveCoaching ? "#6D5EF3" : "rgba(255,255,255,0.15)" }}
                    className="w-9 h-5 rounded-full transition-colors relative flex-shrink-0">
                    <span className={cn("absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-transform", liveCoaching ? "translate-x-4" : "translate-x-0")} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── RECORDING ──
  if (phase === "recording" && currentQ) {
    const displayQ = isFollowUp && currentAnalysis?.followUpQuestion ? currentAnalysis.followUpQuestion : currentQ.text
    const fullTranscript = transcript + liveText
    return (
      <div className="flex flex-col min-h-full">
        <Topbar title={`Recording — Q${qIndex + 1} of ${totalQs}`} />
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Camera */}
              <div className="lg:col-span-2">
                <div className="relative aspect-[4/3] bg-gray-900 rounded-2xl overflow-hidden">
                  {hasCamera
                    ? <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><MicOff className="w-8 h-8 text-gray-600" /></div>
                  }
                  {/* Recording indicator */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-rose-500 rounded-full px-2.5 py-1 text-xs text-white font-medium">
                    <motion.div className="w-2 h-2 rounded-full bg-white"
                      animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
                    REC {fmtTime(recordingSeconds)}
                  </div>
                  {/* Live stats bar */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
                    <div className="flex items-center justify-between text-xs text-white/80">
                      <span className="flex items-center gap-1"><Volume2 className="w-3 h-3" />{wpmLive} wpm</span>
                      <span className={cn(fillerCountLive > 10 ? "text-rose-300" : fillerCountLive > 5 ? "text-amber-300" : "text-white/80")}>
                        {fillerCountLive} filler{fillerCountLive !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live coaching overlay */}
                <AnimatePresence>
                  {liveCoaching && (
                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="mt-3 space-y-2">
                      {recordingSeconds > 120 && (
                        <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
                          style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", color: "#FBBF24" }}>
                          <Timer className="w-3.5 h-3.5 flex-shrink-0" />
                          Wrapping up? Aim to include your result.
                        </div>
                      )}
                      {wpmLive > 165 && (
                        <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
                          style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", color: "#FBBF24" }}>
                          <Volume2 className="w-3.5 h-3.5 flex-shrink-0" />
                          Slightly fast — slow down a touch.
                        </div>
                      )}
                      {fillerCountLive >= 8 && (
                        <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
                          style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#F87171" }}>
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          Many fillers detected — try pausing instead.
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right panel */}
              <div className="lg:col-span-3 space-y-4">
                <div className="rounded-2xl p-4" style={cardStyle}>
                  <p className="text-xs font-medium mb-2" style={{ color: "rgba(255,255,255,0.65)" }}>Question:</p>
                  <p className="text-sm font-semibold text-white leading-relaxed">{displayQ}</p>
                </div>

                {/* Live transcript */}
                <div className="rounded-2xl p-4 min-h-[140px] max-h-[220px] overflow-y-auto" style={cardStyle}>
                  <div className="text-xs font-medium mb-2 flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.65)" }}>
                    <motion.span className="w-2 h-2 rounded-full inline-block" style={{ background: "#34D399" }} animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                    Live Transcript
                  </div>
                  {fullTranscript ? (
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
                      {transcript}
                      <span className="italic" style={{ color: "rgba(255,255,255,0.35)" }}>{liveText}</span>
                    </p>
                  ) : !speechSupported ? (
                    <p className="text-sm italic" style={{ color: "rgba(255,255,255,0.35)" }}>
                      Live transcription isn&apos;t available in this browser — type your answer below and it will be scored the same way.
                    </p>
                  ) : (
                    <p className="text-sm italic" style={{ color: "rgba(255,255,255,0.35)" }}>Start speaking — your words will appear here…</p>
                  )}
                </div>

                {speechError && (
                  <div className="flex items-start gap-2 rounded-xl p-3" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#FBBF24" }} />
                    <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{speechError}</p>
                  </div>
                )}

                {/* Fallback typed answer when transcription or recording is unavailable */}
                {(!mediaRecorderSupported || !speechSupported || speechError) && (
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.65)" }}>Type your response here</label>
                    <textarea
                      value={typedAnswer}
                      onChange={e => setTypedAnswer(e.target.value)}
                      rows={5}
                      placeholder="Type your answer here — it will be submitted and analysed…"
                      className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                      style={inputStyle}
                    />
                  </div>
                )}

                {/* STAR reminder */}
                <div className="grid grid-cols-4 gap-2">
                  {["Situation", "Task", "Action", "Result"].map((s) => (
                    <div key={s} className="rounded-lg p-2 text-center" style={cardStyle}>
                      <p className="text-xs font-bold text-white">{s[0]}</p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{s}</p>
                    </div>
                  ))}
                </div>

                <button onClick={stopRecording}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm text-white bg-rose-500 hover:bg-rose-600 active:scale-[0.99] transition-all flex items-center justify-center gap-2">
                  <Square className="w-4 h-4" />
                  Stop & Submit Answer
                </button>

                <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Your answer will be transcribed and analysed by Ava
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── ANALYZING ──
  if (phase === "analyzing") {
    return (
      <div className="flex flex-col min-h-full">
        <Topbar title="Analysing Your Answer…" />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <motion.div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: "linear-gradient(135deg,#6D5EF3,#5B8DEF)" }}
              animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <Sparkles className="w-7 h-7 text-white" />
            </motion.div>
            <div>
              <h3 className="text-base font-semibold text-white mb-1">Ava is reviewing your answer</h3>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>Checking STAR structure, delivery, and content quality…</p>
            </div>
            <div className="flex flex-col gap-2 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              {["Detecting STAR components", "Counting filler words", "Scoring delivery metrics", "Generating ideal answer", "Preparing follow-up question"].map((s, i) => (
                <motion.div key={s} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.4 }}
                  className="flex items-center gap-2 justify-center">
                  <motion.div style={{ backgroundColor: "#5B8CFF" }} className="w-1.5 h-1.5 rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, delay: i * 0.4, repeat: Infinity }} />
                  {s}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── FEEDBACK ──
  if (phase === "feedback" && currentAnalysis) {
    const a = currentAnalysis
    return (
      <div className="flex flex-col min-h-full">
        <Topbar title={`Answer Feedback — Q${qIndex + 1}`} />
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-5">
            {/* Score row */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-5" style={cardStyle}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs mb-1 font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>{isFollowUp ? "Follow-up" : currentQ?.type} · Q{qIndex + 1}/{totalQs}</p>
                  <p className="text-sm font-semibold text-white line-clamp-2">{a.questionText}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className={cn("text-3xl font-bold", scoreColor(a.overallScore))}>{a.overallScore}</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>/100</p>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2">
                <ScorePill label="Content" score={a.contentScore} />
                <ScorePill label="STAR" score={a.starScore} />
                <ScorePill label="Delivery" score={a.deliveryScore} />
                <ScorePill label="Commercial" score={a.commercialScore} />
                <ScorePill label="Comms" score={a.communicationScore} />
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* STAR breakdown */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="rounded-2xl p-5" style={cardStyle}>
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Target style={{ color: "#5B8CFF" }} className="w-4 h-4" />
                  STAR Analysis
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  <StarBadge has={a.star.hasSituation} label="Situation" />
                  <StarBadge has={a.star.hasTask} label="Task" />
                  <StarBadge has={a.star.hasAction} label="Action" />
                  <StarBadge has={a.star.hasResult} label="Result" />
                </div>
                <div className="flex gap-3 text-xs mb-3">
                  <span className={cn("flex items-center gap-1", a.star.hasQuantifiedResult ? "text-emerald-400" : "text-rose-400")}>
                    {a.star.hasQuantifiedResult ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    Quantified result
                  </span>
                  <span className={cn("flex items-center gap-1", a.star.hasOwnership ? "text-emerald-400" : "text-rose-400")}>
                    {a.star.hasOwnership ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    Clear ownership
                  </span>
                </div>
                {a.star.feedback && <p className="text-xs leading-relaxed rounded-lg p-3" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.65)" }}>{a.star.feedback}</p>}
              </motion.div>

              {/* Delivery & fillers */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="rounded-2xl p-5" style={cardStyle}>
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Volume2 className="w-4 h-4" style={{ color: "#5B8CFF" }} />
                  Delivery Metrics
                </h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Duration</p>
                    <p className="text-sm font-bold text-white">{fmtTime(a.durationSeconds)}</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{a.durationSeconds < 60 ? "Too short" : a.durationSeconds > 180 ? "Too long" : "Good length"}</p>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Speaking pace</p>
                    <p className={cn("text-sm font-bold", a.delivery.pacing === "good" ? "text-emerald-400" : "text-amber-400")}>{a.delivery.wordsPerMinute} wpm</p>
                    <p className="text-xs capitalize" style={{ color: "rgba(255,255,255,0.4)" }}>{a.delivery.pacing}</p>
                  </div>
                </div>
                <div className="rounded-lg p-3"
                  style={a.fillerWords.severity === "low"
                    ? { background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)" }
                    : a.fillerWords.severity === "medium"
                    ? { background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }
                    : { background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }
                  }>
                  <p className="text-xs font-semibold text-white mb-1">Filler Words: {a.fillerWords.total} total ({a.fillerWords.perMinute}/min)</p>
                  {Object.keys(a.fillerWords.breakdown).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(a.fillerWords.breakdown).sort(([, x], [, y]) => y - x).slice(0, 5).map(([word, count]) => (
                        <span key={word} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.65)" }}>"{word}" ×{count}</span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{getFillerFeedback(a.fillerWords)}</p>
                </div>
              </motion.div>
            </div>

            {/* Strengths & improvements */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-2xl p-5" style={cardStyle}>
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Strengths
                </h3>
                <ul className="space-y-2">
                  {a.strengths.length > 0 ? a.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      {s}
                    </li>
                  )) : <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Keep working — strengths develop with practice.</p>}
                </ul>
              </div>
              <div className="rounded-2xl p-5" style={cardStyle}>
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Improvements
                </h3>
                <ul className="space-y-2">
                  {a.improvements.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
                      <ArrowRight className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* Ideal answer */}
            {a.idealAnswer && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="rounded-2xl p-5" style={cardStyle}>
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Sparkles style={{ color: "#8B5CF6" }} className="w-4 h-4" />
                  Ava's Model Answer
                </h3>
                <p className="text-sm leading-relaxed rounded-xl p-4" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)", color: "rgba(255,255,255,0.65)" }}>{a.idealAnswer}</p>
              </motion.div>
            )}

            {/* Transcript */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="rounded-2xl p-5" style={cardStyle}>
              <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" style={{ color: "rgba(255,255,255,0.4)" }} />
                Your Transcript
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{a.transcript || "No transcript captured."}</p>
            </motion.div>

            {/* Downloads card */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="rounded-2xl p-5" style={cardStyle}>
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Download className="w-4 h-4" style={{ color: "rgba(255,255,255,0.4)" }} />
                Download Your Response
              </h3>

              {/* Video playback */}
              {recordedUrl && (
                <div className="mb-4">
                  <video
                    src={recordedUrl}
                    controls
                    playsInline
                    className="w-full rounded-xl bg-gray-900 mb-3"
                    style={{ maxHeight: 300, border: "1px solid rgba(255,255,255,0.08)" }}
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {recordedUrl && (
                  <button
                    onClick={handleDownloadVideo}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
                    style={{ color: "#8B5CF6", border: "1px solid rgba(139,92,246,0.3)", background: "rgba(139,92,246,0.1)" }}>
                    <Video className="w-4 h-4" />
                    Download Video (.webm)
                  </button>
                )}
                <button
                  onClick={handleDownloadTranscript}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
                  style={{ color: "#34D399", border: "1px solid rgba(52,211,153,0.3)", background: "rgba(52,211,153,0.08)" }}>
                  <Download className="w-4 h-4" />
                  Download Transcript (.txt)
                </button>
                <button
                  onClick={handleDownloadHtml}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
                  style={{ color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)" }}>
                  <Download className="w-4 h-4" />
                  Download Summary (.html)
                </button>
              </div>

              {!mediaRecorderSupported && (
                <p className="text-xs mt-3 flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                  <Info className="w-3.5 h-3.5 flex-shrink-0" />
                  Video recording is unavailable in this browser — transcript and HTML downloads are fully supported.
                </p>
              )}
            </motion.div>

            {/* Actions */}
            <div className="flex gap-3 pb-4">
              {a.followUpQuestion && !isFollowUp && (
                <button onClick={handleAnswerFollowUp}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all"
                  style={{ color: "#8B5CF6", border: "1px solid rgba(139,92,246,0.3)", background: "rgba(139,92,246,0.08)" }}>
                  <MessageSquare className="w-4 h-4" />
                  Answer Follow-up
                </button>
              )}
              <button onClick={handleNextQuestion}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white hover:opacity-90 transition-all"
                style={{ background: "linear-gradient(135deg,#6D5EF3,#5B8DEF)" }}>
                {isLastQ && !a.followUpQuestion ? <><Trophy className="w-4 h-4" />Finish & Get Report</> : <><ChevronRight className="w-4 h-4" />{isLastQ ? "Finish Interview" : "Next Question"}</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── REPORT ──
  if (phase === "report") {
    return (
      <div className="flex flex-col min-h-full">
        <Topbar title="Interview Report" />
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-5">
            {generatingReport || !finalReport ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <motion.div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#6D5EF3,#5B8DEF)" }}
                  animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <BarChart3 className="w-7 h-7 text-white" />
                </motion.div>
                <div className="text-center">
                  <h3 className="text-base font-semibold text-white mb-1">Generating your full report…</h3>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>Ava is synthesising all {answers.length} answers</p>
                </div>
              </div>
            ) : (
              <>
                {/* Hero */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-6 text-white"
                  style={{ background: "linear-gradient(135deg,#6D5EF3,#5B8DEF)" }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.7)" }}>{setup.sector} · {setup.mode} · {setup.difficulty}</p>
                      <h2 className="text-2xl font-bold mb-1">Session Complete</h2>
                      <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>{answers.length} questions · {fmtTime(finalReport.totalDurationSeconds)} total</p>
                    </div>
                    <div className="text-right">
                      <p className="text-5xl font-bold">{finalReport.overallScore}</p>
                      <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>/100</p>
                      <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.8)" }}>{scoreLabel(finalReport.overallScore)}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Score grid */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {[
                    { label: "Content", score: finalReport.contentScore as number | null },
                    { label: "STAR", score: finalReport.starScore as number | null },
                    { label: "Delivery", score: finalReport.deliveryScore as number | null },
                    { label: "Commercial", score: finalReport.commercialScore as number | null },
                    { label: "Comms", score: finalReport.communicationScore as number | null },
                    { label: "Body Language", score: null as number | null },
                  ].map(({ label, score }) => (
                    <div key={label} className="rounded-2xl p-3 text-center"
                      style={score !== null ? scoreBgStyle(score) : cardStyle}>
                      <p className="text-xs font-medium mb-1" style={{ color: "rgba(255,255,255,0.65)" }}>{label}</p>
                      {score !== null
                        ? <p className={cn("text-xl font-bold", scoreColor(score))}>{score}</p>
                        : <div><p className="text-base font-bold" style={{ color: "rgba(255,255,255,0.4)" }}>—</p><p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Beta</p></div>
                      }
                    </div>
                  ))}
                </motion.div>

                {/* Session stats */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                  className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl p-4 text-center" style={cardStyle}>
                    <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Total Fillers</p>
                    <p className={cn("text-2xl font-bold", finalReport.totalFillerWords > 20 ? "text-rose-400" : finalReport.totalFillerWords > 10 ? "text-amber-400" : "text-emerald-400")}>{finalReport.totalFillerWords}</p>
                  </div>
                  <div className="rounded-2xl p-4 text-center" style={cardStyle}>
                    <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Avg Pace</p>
                    <p className={cn("text-2xl font-bold", finalReport.avgWordsPerMinute >= 110 && finalReport.avgWordsPerMinute <= 155 ? "text-emerald-400" : "text-amber-400")}>{finalReport.avgWordsPerMinute} wpm</p>
                  </div>
                  <div className="rounded-2xl p-4 text-center" style={cardStyle}>
                    <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Total Time</p>
                    <p className="text-2xl font-bold text-white">{fmtTime(finalReport.totalDurationSeconds)}</p>
                  </div>
                </motion.div>

                {/* Recruiter feedback */}
                {finalReport.recruiterFeedback && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="rounded-2xl p-5" style={cardStyle}>
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <MessageSquare style={{ color: "#8B5CF6" }} className="w-4 h-4" />
                      Ava's Recruiter Debrief
                    </h3>
                    <p className="text-sm leading-relaxed rounded-xl p-4" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)", color: "rgba(255,255,255,0.65)" }}>{finalReport.recruiterFeedback}</p>
                  </motion.div>
                )}

                {/* Strengths & improvements */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-2xl p-5" style={cardStyle}>
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-emerald-400" />
                      Session Strengths
                    </h3>
                    <ul className="space-y-2">
                      {finalReport.strengths?.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
                          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-2xl p-5" style={cardStyle}>
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      Priority Improvements
                    </h3>
                    <ul className="space-y-2">
                      {finalReport.improvements?.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
                          <ArrowRight className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>

                {/* Improvement roadmap */}
                {finalReport.improvementRoadmap?.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="rounded-2xl p-5" style={cardStyle}>
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" style={{ color: "#5B8CFF" }} />
                      Improvement Roadmap
                    </h3>
                    <div className="space-y-2">
                      {finalReport.improvementRoadmap.map((step, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                          <span className="w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "#6D5EF3" }}>{i + 1}</span>
                          <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>{step}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Per-question summary */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                  className="rounded-2xl p-5" style={cardStyle}>
                  <h3 className="text-sm font-semibold text-white mb-3">Answer Breakdown</h3>
                  <div className="space-y-2">
                    {answers.map((a, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 text-white")}
                          style={scoreBgStyle(a.overallScore)}>
                          <span className={scoreColor(a.overallScore)}>{a.overallScore}</span>
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate">{a.questionText}</p>
                          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{a.delivery.wordsPerMinute} wpm · {a.fillerWords.total} fillers · {fmtTime(a.durationSeconds)}</p>
                        </div>
                        {i === finalReport.strongestAnswerIndex && <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: "rgba(52,211,153,0.12)", color: "#34D399", border: "1px solid rgba(52,211,153,0.25)" }}>Strongest</span>}
                        {i === finalReport.weakestAnswerIndex && answers.length > 1 && <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: "rgba(251,191,36,0.12)", color: "#FBBF24", border: "1px solid rgba(251,191,36,0.25)" }}>Focus here</span>}
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* AI disclaimer */}
                <div className="flex items-start gap-2 rounded-xl p-4" style={cardStyle}>
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }} />
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>This feedback is AI-generated and designed to support interview preparation. It should not be treated as an exact recruiter assessment. Body language analysis is in beta — visual scoring requires camera access and will be available in a future release.</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pb-4">
                  <button onClick={handleRestart}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white hover:opacity-90 transition-all"
                    style={{ background: "linear-gradient(135deg,#6D5EF3,#5B8DEF)" }}>
                    <RefreshCw className="w-4 h-4" />
                    Practice Again
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}

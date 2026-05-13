"use client"
import { useState } from "react"
import { Topbar } from "@/components/layout/topbar"
import { demoReadinessScores, sectors } from "@/lib/mock-data"
import { cn, getScoreColor, getScoreBg, getScoreLabel } from "@/lib/utils"
import { ChevronDown, Play, CheckCircle, ArrowRight, FileText, Trophy, AlertTriangle, TrendingUp, Loader2 } from "lucide-react"

type Phase = "setup" | "active" | "report"

const examStages = [
  { id: "cv", label: "CV Screening", description: "ATS pass/fail simulation", score: 68 },
  { id: "motivational", label: "Motivational", description: "Why this firm / role", score: 72 },
  { id: "psychometric", label: "Psychometric", description: "Numerical + verbal reasoning", score: 78 },
  { id: "video", label: "Video Interview", description: "First-round competency questions", score: 64 },
  { id: "competency", label: "Competency Interview", description: "STAR-based interview", score: 75 },
  { id: "sector", label: "Sector Knowledge", description: "Commercial awareness quiz", score: 70 },
  { id: "sjt", label: "SJT", description: "Situational judgement test", score: 74 },
  { id: "case", label: "Case Study", description: "Business problem structuring", score: 62 },
  { id: "final", label: "Final Interview", description: "Senior stakeholder interview", score: 66 },
]

const overallExamScore = Math.round(examStages.reduce((a, b) => a + b.score, 0) / examStages.length)

export default function FullProcessExamPage() {
  const [phase, setPhase] = useState<Phase>("setup")
  const [targetRole, setTargetRole] = useState("Graduate Analyst – Financial Services Consulting")
  const [targetSector, setTargetSector] = useState("Consulting")
  const [cvText, setCvText] = useState("")
  const [jobSpec, setJobSpec] = useState("")
  const [activeStage, setActiveStage] = useState(0)
  const [completedStages, setCompletedStages] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)

  const handleStartExam = async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 1500))
    setLoading(false)
    setPhase("active")
    setCompletedStages(new Set())
    setActiveStage(0)
  }

  const handleCompleteStage = () => {
    setCompletedStages(prev => new Set([...prev, activeStage]))
    if (activeStage < examStages.length - 1) {
      setActiveStage(prev => prev + 1)
    } else {
      setPhase("report")
    }
  }

  const handleViewDemoReport = () => {
    setCompletedStages(new Set(examStages.map((_, i) => i)))
    setPhase("report")
  }

  if (phase === "report") {
    const sortedByScore = [...examStages].sort((a, b) => b.score - a.score)
    const strongest = sortedByScore[0]
    const weakest = sortedByScore[sortedByScore.length - 1]
    const passLikelihood = overallExamScore >= 75 ? "Strong Candidate" : overallExamScore >= 60 ? "Borderline" : "Not Yet Ready"
    const passColor = overallExamScore >= 75 ? "bg-green-100 text-green-700" : overallExamScore >= 60 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"

    return (
      <div className="flex flex-col min-h-full">
        <Topbar title="Full Process Exam — Final Report" />
        <div className="flex-1 p-6 space-y-6">

          <div className="bg-gradient-to-r from-[#0a0f1e] to-[#1e293b] rounded-2xl p-8 text-white">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">Full Recruitment Process Report</h2>
                <p className="text-ink-faint mb-4">{targetRole} · {targetSector}</p>
                <span className={cn("text-sm font-semibold px-4 py-2 rounded-full", passColor)}>
                  {passLikelihood}
                </span>
              </div>
              <div className="text-right">
                <p className="text-ink-faint text-xs mb-1">Overall Score</p>
                <p className={cn("text-5xl font-bold", getScoreColor(overallExamScore))}>{overallExamScore}</p>
                <p className="text-ink-faint">/100</p>
              </div>
            </div>
          </div>

          {/* Stage scores table */}
          <div className="bg-white rounded-2xl border border-surface-border p-6">
            <h3 className="text-sm font-semibold text-ink mb-4">Stage-by-Stage Results</h3>
            <div className="space-y-3">
              {examStages.map((stage) => (
                <div key={stage.id} className="flex items-center gap-4">
                  <div className="w-40 flex-shrink-0">
                    <p className="text-sm font-medium text-ink">{stage.label}</p>
                    <p className="text-xs text-ink-faint">{stage.description}</p>
                  </div>
                  <div className="flex-1 h-2 bg-surface-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", getScoreBg(stage.score))}
                      style={{ width: `${stage.score}%` }}
                    />
                  </div>
                  <span className={cn("text-sm font-bold w-12 text-right", getScoreColor(stage.score))}>
                    {stage.score}/100
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-5 h-5 text-green-600" />
                <h3 className="text-sm font-semibold text-ink">Strongest Stage</h3>
              </div>
              <p className="text-lg font-bold text-ink">{strongest.label}</p>
              <p className={cn("text-3xl font-bold mt-1", getScoreColor(strongest.score))}>{strongest.score}/100</p>
              <p className="text-sm text-ink-muted mt-2">This is your competitive advantage — lean into it in applications.</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h3 className="text-sm font-semibold text-ink">Weakest Stage</h3>
              </div>
              <p className="text-lg font-bold text-ink">{weakest.label}</p>
              <p className={cn("text-3xl font-bold mt-1", getScoreColor(weakest.score))}>{weakest.score}/100</p>
              <p className="text-sm text-ink-muted mt-2">Focus your preparation here before submitting applications.</p>
            </div>
          </div>

          {/* Improvement roadmap */}
          <div className="bg-white rounded-2xl border border-surface-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <h3 className="text-sm font-semibold text-ink">Improvement Roadmap</h3>
            </div>
            <div className="space-y-3">
              {[
                { priority: "Week 1", action: `Complete 3 Video Interview practice sessions to raise ${weakest.label} score`, impact: "+8 pts" },
                { priority: "Week 1-2", action: "Quantify all CV bullet points and add missing ATS keywords", impact: "+6 pts" },
                { priority: "Week 2", action: "Study case structuring frameworks (MECE, issue trees) for Case Study", impact: "+7 pts" },
                { priority: "Week 2-3", action: "Practice 10 further Numerical Reasoning tests under timed conditions", impact: "+4 pts" },
                { priority: "Ongoing", action: "Read industry press (FT, WSJ) for 15 minutes daily to boost Commercial Awareness", impact: "+5 pts" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-surface-muted rounded-xl border border-surface-border">
                  <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2.5 py-1 rounded-full flex-shrink-0 whitespace-nowrap">
                    {item.priority}
                  </span>
                  <p className="text-sm text-ink flex-1">{item.action}</p>
                  <span className="text-sm font-bold text-green-600 flex-shrink-0">{item.impact}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Final recommendation */}
          <div className={cn(
            "rounded-2xl p-8 text-center",
            overallExamScore >= 75 ? "bg-green-50 border-2 border-green-300" : "bg-amber-50 border-2 border-amber-300"
          )}>
            {overallExamScore >= 75 ? (
              <>
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-ink">Apply Now</h3>
                <p className="text-sm text-ink-muted mt-2 max-w-md mx-auto">Your readiness score is above the recommended threshold. You are ready to start submitting applications. Continue practising to push your score above 85.</p>
              </>
            ) : (
              <>
                <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-ink">Keep Preparing</h3>
                <p className="text-sm text-ink-muted mt-2 max-w-md mx-auto">Complete the improvement actions above before submitting applications. Target a score of 75+ before applying to top-tier firms.</p>
              </>
            )}
            <div className="flex gap-3 justify-center mt-6">
              <button
                onClick={() => setPhase("setup")}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
              >
                Retake Exam
              </button>
              <button className="px-6 py-3 bg-surface-muted text-ink rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors">
                Download Report
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (phase === "active") {
    const stage = examStages[activeStage]
    return (
      <div className="flex flex-col min-h-full">
        <Topbar title="Full Process Exam — Live" />
        <div className="flex-1 p-6 space-y-6">

          {/* Stage progress */}
          <div className="bg-white rounded-2xl border border-surface-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-ink">Stage Progress</h3>
              <span className="text-xs text-ink-muted">{completedStages.size}/{examStages.length} complete</span>
            </div>
            <div className="flex gap-1">
              {examStages.map((s, i) => (
                <div
                  key={s.id}
                  className={cn(
                    "flex-1 h-2 rounded-full",
                    completedStages.has(i) ? "bg-green-500" :
                    i === activeStage ? "bg-blue-500" : "bg-gray-200"
                  )}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-1 mt-3">
              {examStages.map((s, i) => (
                <span
                  key={s.id}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-full font-medium transition-all",
                    completedStages.has(i) ? "bg-green-100 text-green-700" :
                    i === activeStage ? "bg-blue-100 text-blue-700 ring-2 ring-blue-300" :
                    "bg-surface-muted text-ink-muted"
                  )}
                >
                  {s.label}
                </span>
              ))}
            </div>
          </div>

          {/* Current stage */}
          <div className="bg-gradient-to-r from-[#0a0f1e] to-[#1e293b] rounded-2xl p-8 text-white">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-full">Stage {activeStage + 1}</span>
            </div>
            <h2 className="text-2xl font-bold mb-1">{stage.label}</h2>
            <p className="text-ink-faint">{stage.description}</p>
          </div>

          <div className="bg-white rounded-2xl border border-surface-border p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-ink mb-2">Complete {stage.label}</h3>
            <p className="text-sm text-ink-muted mb-6 max-w-md mx-auto">
              In the full version, this stage would load the relevant module (e.g. video recording, psychometric quiz, STAR builder). For now, mark as complete to advance.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleCompleteStage}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Complete Stage
              </button>
              <button
                onClick={handleViewDemoReport}
                className="px-6 py-3 bg-surface-muted text-ink rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
              >
                Skip to Report
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full">
      <Topbar title="Full Process Exam" />
      <div className="flex-1 p-6 space-y-6">

        <div className="bg-gradient-to-r from-[#0a0f1e] to-[#1e293b] rounded-2xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-2">Mock Recruitment Process</h2>
          <p className="text-ink-faint text-sm max-w-xl">
            Experience the full graduate recruitment process from CV screening to final interview — all in one simulated session. Get a comprehensive readiness report at the end.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {examStages.map((s, i) => (
              <span key={s.id} className="text-xs bg-white/10 text-ink-faint px-2.5 py-1 rounded-full">
                {i + 1}. {s.label}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-surface-border p-6 max-w-2xl">
          <h3 className="text-base font-semibold text-ink mb-4">Configure Your Exam</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-2">Target Role</label>
              <input
                value={targetRole}
                onChange={e => setTargetRole(e.target.value)}
                className="w-full px-4 py-3 border border-surface-border rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-2">Target Sector</label>
              <div className="relative">
                <select
                  value={targetSector}
                  onChange={e => setTargetSector(e.target.value)}
                  className="w-full px-4 py-3 border border-surface-border rounded-xl text-sm text-ink appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-2">CV (paste text — optional)</label>
              <textarea
                value={cvText}
                onChange={e => setCvText(e.target.value)}
                placeholder="Paste your CV text to get personalised feedback..."
                className="w-full h-32 px-4 py-3 border border-surface-border rounded-xl text-sm text-ink resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-2">Job Description (optional)</label>
              <textarea
                value={jobSpec}
                onChange={e => setJobSpec(e.target.value)}
                placeholder="Paste the job description to tailor the exam..."
                className="w-full h-24 px-4 py-3 border border-surface-border rounded-xl text-sm text-ink resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleStartExam}
                disabled={loading}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all",
                  loading ? "bg-surface-muted text-ink-faint" : "bg-blue-600 text-white hover:bg-blue-700"
                )}
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Preparing...</> : <><Play className="w-4 h-4" />Begin Full Process Exam</>}
              </button>
              <button
                onClick={handleViewDemoReport}
                className="px-6 py-3 bg-surface-muted text-ink rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
              >
                View Demo Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

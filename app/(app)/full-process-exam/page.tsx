"use client"
import { useState } from "react"
import { Topbar } from "@/components/layout/topbar"
import { ReadinessRing } from "@/components/ui/ReadinessRing"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { demoReadinessScores, sectors } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import {
  ChevronDown, Play, CheckCircle, ArrowRight, Trophy,
  AlertTriangle, TrendingUp, Loader2, ClipboardList,
  Lock, CheckCircle2, Circle, Zap, Target,
} from "lucide-react"

type Phase = "setup" | "active" | "report"

const examStages = [
  { id: "cv",          label: "CV Screening",         description: "ATS pass/fail simulation",            score: 68, color: "blue" },
  { id: "motivational",label: "Motivational",          description: "Why this firm / role",                score: 72, color: "violet" },
  { id: "psychometric",label: "Psychometric",          description: "Numerical + verbal reasoning",        score: 78, color: "cyan" },
  { id: "video",       label: "Video Interview",       description: "First-round competency questions",    score: 64, color: "violet" },
  { id: "competency",  label: "Competency Interview",  description: "STAR-based interview",               score: 75, color: "green" },
  { id: "sector",      label: "Sector Knowledge",      description: "Commercial awareness quiz",           score: 70, color: "amber" },
  { id: "sjt",         label: "SJT",                   description: "Situational judgement test",          score: 74, color: "cyan" },
  { id: "case",        label: "Case Study",            description: "Business problem structuring",        score: 62, color: "blue" },
  { id: "final",       label: "Final Interview",       description: "Senior stakeholder interview",        score: 66, color: "amber" },
] as const

type StageColor = "blue" | "violet" | "cyan" | "green" | "amber"

const colorMap: Record<StageColor, { badge: string; bar: string; glow: string }> = {
  blue:   { badge: "blue",   bar: "bg-blue-500",   glow: "shadow-[0_0_12px_rgba(37,99,235,0.35)]" },
  violet: { badge: "violet", bar: "bg-violet-500", glow: "shadow-[0_0_12px_rgba(139,92,246,0.35)]" },
  cyan:   { badge: "cyan",   bar: "bg-cyan-500",   glow: "shadow-[0_0_12px_rgba(34,211,238,0.3)]" },
  green:  { badge: "green",  bar: "bg-emerald-500",glow: "shadow-[0_0_12px_rgba(34,197,94,0.3)]" },
  amber:  { badge: "amber",  bar: "bg-amber-500",  glow: "shadow-[0_0_12px_rgba(251,191,36,0.3)]" },
}

function scoreBarColor(score: number) {
  if (score >= 75) return "bg-emerald-500"
  if (score >= 60) return "bg-blue-500"
  return "bg-amber-500"
}
function scoreTextColor(score: number) {
  if (score >= 75) return "text-emerald-400"
  if (score >= 60) return "text-blue-400"
  return "text-amber-400"
}

const overallExamScore = Math.round(examStages.reduce((a, b) => a + b.score, 0) / examStages.length)

// ─── Shared ambient glows ──────────────────────────────────────────────────────
function AmbientGlows() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-violet-600/5 rounded-full blur-3xl" />
    </div>
  )
}

// ─── Stage rail chips ──────────────────────────────────────────────────────────
function StageRail({
  stages, completedStages, activeStage,
}: {
  stages: typeof examStages
  completedStages: Set<number>
  activeStage: number
}) {
  return (
    <div className="bg-[rgba(11,27,51,0.7)] border border-[rgba(148,163,184,0.1)] rounded-2xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-slate-400">Stage Progress</p>
        <span className="text-xs text-slate-500">{completedStages.size}/{stages.length}</span>
      </div>
      {/* Progress bar */}
      <div className="flex gap-0.5 mb-3">
        {stages.map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex-1 h-1.5 rounded-full transition-all duration-500",
              completedStages.has(i)
                ? "bg-emerald-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]"
                : i === activeStage
                ? "bg-blue-500 shadow-[0_0_6px_rgba(37,99,235,0.5)]"
                : "bg-[rgba(148,163,184,0.1)]"
            )}
          />
        ))}
      </div>
      {/* Chips — horizontal scroll on mobile */}
      <div className="flex flex-wrap gap-1.5">
        {stages.map((s, i) => {
          const done = completedStages.has(i)
          const active = i === activeStage
          const locked = !done && !active
          return (
            <span
              key={s.id}
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border transition-all",
                done   && "bg-[rgba(34,197,94,0.1)] border-[rgba(34,197,94,0.25)] text-emerald-400",
                active && "bg-[rgba(37,99,235,0.12)] border-[rgba(37,99,235,0.3)] text-blue-300 stage-active-glow",
                locked && "bg-[rgba(148,163,184,0.04)] border-[rgba(148,163,184,0.1)] text-slate-600"
              )}
            >
              {done   && <CheckCircle2 className="w-3 h-3" />}
              {active && <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />}
              {locked && <Lock className="w-2.5 h-2.5 opacity-40" />}
              {s.label}
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ─── REPORT PHASE ─────────────────────────────────────────────────────────────
function ReportPhase({
  targetRole, targetSector, onRetake,
}: {
  targetRole: string
  targetSector: string
  onRetake: () => void
}) {
  const sortedByScore = [...examStages].sort((a, b) => b.score - a.score)
  const strongest = sortedByScore[0]
  const weakest = sortedByScore[sortedByScore.length - 1]
  const passed = overallExamScore >= 75

  const passVariant = passed ? "green" : overallExamScore >= 60 ? "amber" : "red"
  const passLabel = passed ? "Strong Candidate" : overallExamScore >= 60 ? "Borderline" : "Not Yet Ready"

  return (
    <div className="flex flex-col min-h-full bg-grid relative">
      <AmbientGlows />
      <Topbar title="Full Process Exam — Final Report" />
      <div className="relative z-10 flex-1 p-6 space-y-5 max-w-5xl mx-auto w-full">

        {/* Report hero */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1B33] to-[#0F172A] border border-[rgba(148,163,184,0.12)] rounded-2xl p-7">
          <div className="absolute top-0 right-0 w-72 h-72 bg-blue-600/6 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-violet-600/6 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6 justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge variant={passVariant} dot pulse={!passed}>
                  {passLabel}
                </StatusBadge>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Full Recruitment Process Report</h2>
              <p className="text-slate-400 text-sm">{targetRole} · {targetSector}</p>
            </div>
            <div className="flex-shrink-0">
              <ReadinessRing score={overallExamScore} size={130} />
            </div>
          </div>
        </div>

        {/* Stage grid */}
        <div className="bg-[rgba(15,23,42,0.65)] border border-[rgba(148,163,184,0.12)] rounded-2xl p-5 backdrop-blur-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Stage-by-Stage Results</p>
          <div className="space-y-3">
            {examStages.map((stage) => {
              const c = colorMap[stage.color as StageColor]
              return (
                <div key={stage.id} className="flex items-center gap-4">
                  <div className="w-36 flex-shrink-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{stage.label}</p>
                    <p className="text-xs text-slate-500 truncate">{stage.description}</p>
                  </div>
                  <div className="flex-1 h-1.5 bg-[rgba(148,163,184,0.08)] rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-700", scoreBarColor(stage.score))}
                      style={{ width: `${stage.score}%` }}
                    />
                  </div>
                  <span className={cn("text-sm font-bold w-14 text-right tabular-nums", scoreTextColor(stage.score))}>
                    {stage.score}/100
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Strongest / Weakest */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[rgba(34,197,94,0.06)] border border-[rgba(34,197,94,0.18)] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-emerald-400" />
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Strongest Stage</p>
            </div>
            <p className="text-base font-bold text-white mb-1">{strongest.label}</p>
            <p className="text-3xl font-bold text-emerald-400 tabular-nums mb-2">{strongest.score}<span className="text-base text-slate-500 font-normal">/100</span></p>
            <p className="text-xs text-slate-400">This is your competitive advantage — lean into it in applications.</p>
          </div>
          <div className="bg-[rgba(251,113,133,0.06)] border border-[rgba(251,113,133,0.18)] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wide">Weakest Stage</p>
            </div>
            <p className="text-base font-bold text-white mb-1">{weakest.label}</p>
            <p className="text-3xl font-bold text-red-400 tabular-nums mb-2">{weakest.score}<span className="text-base text-slate-500 font-normal">/100</span></p>
            <p className="text-xs text-slate-400">Focus your preparation here before submitting applications.</p>
          </div>
        </div>

        {/* Improvement roadmap */}
        <div className="bg-[rgba(15,23,42,0.65)] border border-[rgba(148,163,184,0.12)] rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <p className="text-sm font-semibold text-white">Improvement Roadmap</p>
          </div>
          <div className="space-y-2.5">
            {[
              { priority: "Week 1",   action: `Complete 3 Video Interview practice sessions to raise ${weakest.label} score`, impact: "+8 pts", variant: "blue" as const },
              { priority: "Week 1–2", action: "Quantify all CV bullet points and add missing ATS keywords", impact: "+6 pts", variant: "cyan" as const },
              { priority: "Week 2",   action: "Study case structuring frameworks (MECE, issue trees) for Case Study", impact: "+7 pts", variant: "violet" as const },
              { priority: "Week 2–3", action: "Practice 10 Numerical Reasoning tests under timed conditions", impact: "+4 pts", variant: "amber" as const },
              { priority: "Ongoing",  action: "Read FT/WSJ for 15 minutes daily to boost Commercial Awareness", impact: "+5 pts", variant: "green" as const },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3.5 bg-[rgba(148,163,184,0.04)] border border-[rgba(148,163,184,0.08)] rounded-xl">
                <StatusBadge variant={item.variant} className="flex-shrink-0 whitespace-nowrap mt-0.5">
                  {item.priority}
                </StatusBadge>
                <p className="text-sm text-slate-300 flex-1 leading-relaxed">{item.action}</p>
                <span className="text-sm font-bold text-emerald-400 flex-shrink-0">{item.impact}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Final recommendation */}
        <div className={cn(
          "rounded-2xl p-7 text-center border",
          passed
            ? "bg-[rgba(34,197,94,0.06)] border-[rgba(34,197,94,0.2)]"
            : "bg-[rgba(251,191,36,0.06)] border-[rgba(251,191,36,0.2)]"
        )}>
          {passed ? (
            <>
              <CheckCircle className={cn("w-10 h-10 mx-auto mb-3", "text-emerald-400")} />
              <h3 className="text-lg font-bold text-white mb-1">Apply Now</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Your readiness score is above the recommended threshold. Start submitting applications and keep practising to push above 85.
              </p>
            </>
          ) : (
            <>
              <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-amber-400" />
              <h3 className="text-lg font-bold text-white mb-1">Keep Preparing</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Complete the improvement actions above before applying. Target 75+ before top-tier firms.
              </p>
            </>
          )}
          <div className="flex gap-3 justify-center mt-5">
            <button onClick={onRetake} className="btn-gradient flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm">
              <Circle className="w-4 h-4" /> Retake Exam
            </button>
            <button className="btn-ghost flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm">
              Download Report
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── ACTIVE PHASE ─────────────────────────────────────────────────────────────
function ActivePhase({
  activeStage, completedStages, onComplete, onSkip,
}: {
  activeStage: number
  completedStages: Set<number>
  onComplete: () => void
  onSkip: () => void
}) {
  const stage = examStages[activeStage]
  const c = colorMap[stage.color as StageColor]

  return (
    <div className="flex flex-col min-h-full bg-grid relative">
      <AmbientGlows />
      <Topbar title="Full Process Exam — Live" />
      <div className="relative z-10 flex-1 p-6 space-y-5 max-w-5xl mx-auto w-full">

        {/* Stage rail */}
        <StageRail stages={examStages} completedStages={completedStages} activeStage={activeStage} />

        {/* Mission header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#0B1B33] to-[#0F172A] border border-[rgba(148,163,184,0.12)] rounded-2xl p-7">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/8 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <StatusBadge variant="blue" dot pulse>
                Stage {activeStage + 1} of {examStages.length}
              </StatusBadge>
              <StatusBadge variant={c.badge as any}>
                {stage.color.charAt(0).toUpperCase() + stage.color.slice(1)} category
              </StatusBadge>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">{stage.label}</h2>
            <p className="text-slate-400 text-sm">{stage.description}</p>
          </div>
        </div>

        {/* Stage action card */}
        <div className="bg-[rgba(15,23,42,0.65)] border border-[rgba(148,163,184,0.12)] rounded-2xl p-8 text-center backdrop-blur-sm">
          <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5", `bg-[rgba(37,99,235,0.1)] ${c.glow}`)}>
            <Play className="w-7 h-7 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Complete {stage.label}</h3>
          <p className="text-sm text-slate-400 mb-7 max-w-md mx-auto leading-relaxed">
            In the full version, this stage loads the relevant module — video recording, psychometric quiz, STAR builder, etc. Mark complete to advance.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={onComplete} className="btn-gradient flex items-center gap-2 px-7 py-3 rounded-xl text-sm">
              <CheckCircle className="w-4 h-4" /> Complete Stage
            </button>
            <button onClick={onSkip} className="btn-ghost flex items-center gap-2 px-7 py-3 rounded-xl text-sm">
              Skip to Report
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── SETUP PHASE ──────────────────────────────────────────────────────────────
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
    await new Promise(r => setTimeout(r, 1400))
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
    return (
      <ReportPhase
        targetRole={targetRole}
        targetSector={targetSector}
        onRetake={() => setPhase("setup")}
      />
    )
  }

  if (phase === "active") {
    return (
      <ActivePhase
        activeStage={activeStage}
        completedStages={completedStages}
        onComplete={handleCompleteStage}
        onSkip={handleViewDemoReport}
      />
    )
  }

  // ── Setup phase ──
  return (
    <div className="flex flex-col min-h-full bg-grid relative">
      <AmbientGlows />
      <Topbar title="Full Process Exam" />
      <div className="relative z-10 flex-1 p-6 space-y-5 max-w-5xl mx-auto w-full">

        {/* Mission briefing banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1B33] to-[#0F172A] border border-[rgba(148,163,184,0.12)] rounded-2xl p-7">
          <div className="absolute top-0 right-0 w-72 h-72 bg-blue-600/6 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-56 h-56 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <StatusBadge variant="blue" dot>
                <ClipboardList className="w-3 h-3" />
                9-Stage Recruitment Simulator
              </StatusBadge>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Mock Recruitment Process</h2>
            <p className="text-slate-400 text-sm max-w-xl mb-5 leading-relaxed">
              Experience the full graduate recruitment process — from CV screening to final interview — in one simulated session. Receive a comprehensive readiness report at the end.
            </p>
            <div className="flex flex-wrap gap-2">
              {examStages.map((s, i) => (
                <span key={s.id} className="text-xs bg-[rgba(148,163,184,0.06)] border border-[rgba(148,163,184,0.1)] text-slate-400 px-2.5 py-1 rounded-full">
                  {i + 1}. {s.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Config form */}
        <div className="bg-[rgba(15,23,42,0.65)] border border-[rgba(148,163,184,0.12)] rounded-2xl p-6 backdrop-blur-sm max-w-2xl">
          <div className="flex items-center gap-2 mb-5">
            <Target className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Configure Your Exam</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Target Role</label>
              <input
                value={targetRole}
                onChange={e => setTargetRole(e.target.value)}
                className="input-dark"
                placeholder="e.g. Graduate Analyst – Investment Banking"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Target Sector</label>
              <div className="relative">
                <select
                  value={targetSector}
                  onChange={e => setTargetSector(e.target.value)}
                  className="input-dark appearance-none pr-10 cursor-pointer"
                  style={{ background: "rgba(7,17,31,0.7)" }}
                >
                  {sectors.map(s => <option key={s} value={s} style={{ background: "#0F172A" }}>{s}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">CV (paste text — optional)</label>
              <textarea
                value={cvText}
                onChange={e => setCvText(e.target.value)}
                placeholder="Paste your CV text to get personalised feedback…"
                className="input-dark h-28 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Job Description (optional)</label>
              <textarea
                value={jobSpec}
                onChange={e => setJobSpec(e.target.value)}
                placeholder="Paste the job description to tailor the exam…"
                className="input-dark h-20 resize-none"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={handleStartExam}
                disabled={loading}
                className="btn-gradient flex items-center gap-2 px-6 py-3 rounded-xl text-sm"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Preparing Exam…</>
                  : <><Play className="w-4 h-4" />Begin Full Process Exam</>}
              </button>
              <button
                onClick={handleViewDemoReport}
                className="btn-ghost flex items-center gap-2 px-6 py-3 rounded-xl text-sm"
              >
                <Zap className="w-4 h-4" /> View Demo Report
              </button>
            </div>
          </div>
        </div>

        {/* Stage preview cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {examStages.slice(0, 5).map((s, i) => {
            const c = colorMap[s.color as StageColor]
            return (
              <div key={s.id} className="bg-[rgba(15,23,42,0.5)] border border-[rgba(148,163,184,0.1)] rounded-xl p-3 text-center">
                <p className="text-[10px] text-slate-500 mb-1">Stage {i + 1}</p>
                <p className="text-xs font-semibold text-slate-300 leading-tight">{s.label}</p>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}

"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { getApp, updateApp, moveToStage, saveBreakdown } from "@/lib/tracker/store"
import type { TrackerApp, Stage, RoleBreakdown } from "@/lib/tracker/types"
import { STAGES, getStage, getReadinessBand, SECTORS } from "@/lib/tracker/types"
import {
  ArrowLeft, Sparkles, Loader2, Building2, MapPin, Calendar, Briefcase,
  ChevronDown, CheckCircle, AlertCircle, Star, Target, BookOpen,
  MessageSquare, Brain, FileText, Clock, ExternalLink, Edit3,
  TrendingUp, Zap, Shield, BarChart3, ChevronRight, RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Tab = "overview" | "breakdown" | "interview" | "star" | "notes" | "timeline"

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "overview",   label: "Overview",      icon: Target },
  { id: "breakdown",  label: "AI Breakdown",  icon: Sparkles },
  { id: "interview",  label: "Interview Prep",icon: MessageSquare },
  { id: "star",       label: "STAR Stories",  icon: Star },
  { id: "notes",      label: "Notes",         icon: FileText },
  { id: "timeline",   label: "Timeline",      icon: Clock },
]

function scoreColor(s: number) {
  if (s >= 75) return "#059669"
  if (s >= 60) return "#6D5EF3"
  if (s >= 40) return "#D97706"
  return "#EF4444"
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

function daysUntil(dateStr?: string) {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

function companyColor(name: string) {
  const COLORS = ["#6D5EF3","#5B8DEF","#10B981","#F97316","#EF4444","#8B5CF6","#06B6D4","#F59E0B","#EC4899","#14B8A6"]
  let hash = 0
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff
  return COLORS[Math.abs(hash) % COLORS.length]
}

// ─── Section helpers ──────────────────────────────────────────────────────────

function SectionCard({ title, icon: Icon, children, accent }: { title: string; icon: any; children: React.ReactNode; accent?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-surface-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accent ?? "#6D5EF3"}15` }}>
          <Icon className="w-4 h-4" style={{ color: accent ?? "#6D5EF3" }} />
        </div>
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function TagList({ items, color = "#6D5EF3" }: { items: string[]; color?: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span key={i} className="px-3 py-1 rounded-full text-xs font-medium border"
          style={{ backgroundColor: `${color}10`, color, borderColor: `${color}30` }}>
          {item}
        </span>
      ))}
    </div>
  )
}

function BulletList({ items, icon: Icon = CheckCircle, color = "#6D5EF3" }: { items: string[]; icon?: any; color?: string }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-ink-muted">
          <Icon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color }} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ app }: { app: TrackerApp }) {
  const days = daysUntil(app.deadline)
  const stage = getStage(app.stage)

  return (
    <div className="space-y-5">
      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Stage", value: stage.label, color: stage.color, sub: null },
          { label: "Readiness", value: app.readinessScore ? `${app.readinessScore}/100` : "—", color: app.readinessScore ? scoreColor(app.readinessScore) : "#9CA3AF", sub: null },
          { label: "Deadline", value: days === null ? "—" : days < 0 ? "Closed" : days === 0 ? "Today!" : `${days} days`, color: days !== null && days <= 7 ? "#EF4444" : "#374151", sub: app.deadline ? fmtDate(app.deadline) : null },
          { label: "Sector", value: app.sector, color: "#374151", sub: app.workType ?? null },
        ].map(({ label, value, color, sub }) => (
          <div key={label} className="bg-white rounded-2xl border border-surface-border p-4">
            <p className="text-xs text-ink-faint mb-1">{label}</p>
            <p className="text-base font-bold" style={{ color }}>{value}</p>
            {sub && <p className="text-xs text-ink-faint mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Readiness band */}
      {app.readinessScore !== undefined && (() => {
        const band = getReadinessBand(app.readinessScore)
        return (
          <div className="rounded-2xl p-4 flex items-center justify-between" style={{ backgroundColor: band.bg, border: `1px solid ${band.color}30` }}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: band.color }}>Application Readiness</p>
              <p className="text-sm font-medium text-ink">{band.label}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold" style={{ color: band.color }}>{app.readinessScore}</p>
              <p className="text-xs text-ink-faint">/100</p>
            </div>
          </div>
        )
      })()}

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {app.skills.length > 0 && (
          <SectionCard title="Key Skills Required" icon={Zap} accent="#6D5EF3">
            <TagList items={app.skills} color="#6D5EF3" />
          </SectionCard>
        )}
        {app.softSkills.length > 0 && (
          <SectionCard title="Competencies & Soft Skills" icon={Brain} accent="#8B5CF6">
            <TagList items={app.softSkills} color="#8B5CF6" />
          </SectionCard>
        )}
        {app.responsibilities.length > 0 && (
          <SectionCard title="Key Responsibilities" icon={Briefcase} accent="#F97316">
            <BulletList items={app.responsibilities} icon={ChevronRight} color="#F97316" />
          </SectionCard>
        )}
        {app.requirements.length > 0 && (
          <SectionCard title="Requirements" icon={CheckCircle} accent="#10B981">
            <BulletList items={app.requirements} icon={CheckCircle} color="#10B981" />
          </SectionCard>
        )}
      </div>

      {/* Links */}
      {app.url && (
        <a href={app.url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm font-medium text-brand-purple hover:underline">
          <ExternalLink className="w-4 h-4" /> View original job posting
        </a>
      )}
    </div>
  )
}

// ─── Breakdown Tab ────────────────────────────────────────────────────────────

function BreakdownTab({ app, onBreakdownGenerated }: { app: TrackerApp; onBreakdownGenerated: (b: RoleBreakdown) => void }) {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState("")
  const b = app.breakdown

  const generate = async () => {
    setGenerating(true); setError("")
    try {
      const res = await fetch("/api/ai/tracker/breakdown", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: app.company, role: app.role, sector: app.sector, jobDescription: app.jobDescription }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onBreakdownGenerated(data)
    } catch (e: any) {
      setError(e.message || "Generation failed")
    } finally {
      setGenerating(false)
    }
  }

  if (!b) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-5" style={{ background: "linear-gradient(135deg,#EEE9FF,#E0EEFF)" }}>
          <Sparkles className="w-8 h-8" style={{ color: "#6D5EF3" }} />
        </div>
        <h3 className="text-lg font-bold text-ink mb-2">Generate Your AI Preparation Plan</h3>
        <p className="text-sm text-ink-muted max-w-md mx-auto mb-6 leading-relaxed">
          Get a full breakdown: company insights, likely interview questions, STAR story suggestions, a preparation roadmap, and ATS recommendations — all tailored to this specific role.
        </p>
        {error && <p className="text-xs text-red-600 mb-4">{error}</p>}
        <button onClick={generate} disabled={generating}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white mx-auto transition-all hover:opacity-90 disabled:opacity-60"
          style={{ background: "linear-gradient(135deg,#6D5EF3,#5B8DEF)" }}
        >
          {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><Sparkles className="w-4 h-4" /> Generate AI Breakdown</>}
        </button>
        <p className="text-xs text-ink-faint mt-3">AI-generated guidance for interview preparation purposes</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-ink-faint">Generated {fmtDate(b.generatedAt)} · AI-generated guidance for preparation purposes</p>
        <button onClick={generate} disabled={generating} className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition-colors">
          {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Regenerate
        </button>
      </div>

      {/* Readiness + band */}
      {(() => {
        const band = getReadinessBand(b.readinessScore)
        return (
          <div className="rounded-2xl p-4" style={{ backgroundColor: band.bg, border: `1px solid ${band.color}30` }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: band.color }}>Starting Readiness Estimate</p>
                <p className="text-sm text-ink-muted">{band.label} · Preparation will improve this score</p>
              </div>
              <p className="text-4xl font-bold" style={{ color: band.color }}>{b.readinessScore}</p>
            </div>
            <div className="h-2 bg-white/50 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${b.readinessScore}%`, backgroundColor: band.color }} />
            </div>
          </div>
        )
      })()}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Role summary */}
        <div className="bg-white rounded-2xl border border-surface-border p-5 md:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#EEE9FF" }}>
              <Target className="w-4 h-4" style={{ color: "#6D5EF3" }} />
            </div>
            <h3 className="text-sm font-semibold text-ink">Role Summary</h3>
          </div>
          <p className="text-sm text-ink-muted leading-relaxed">{b.roleSummary}</p>
        </div>

        {/* Company overview */}
        <SectionCard title="Company Overview" icon={Building2} accent="#5B8DEF">
          <p className="text-sm text-ink-muted leading-relaxed">{b.companyOverview}</p>
        </SectionCard>

        {/* Culture */}
        <SectionCard title="Culture & Hiring Mindset" icon={Star} accent="#F59E0B">
          <p className="text-sm text-ink-muted leading-relaxed">{b.cultureInsights}</p>
        </SectionCard>

        {/* Key skills */}
        <SectionCard title="Critical Skills" icon={Zap} accent="#6D5EF3">
          <TagList items={b.keySkills} color="#6D5EF3" />
        </SectionCard>

        {/* Competencies */}
        <SectionCard title="Competencies Assessed" icon={Brain} accent="#8B5CF6">
          <TagList items={b.competencies} color="#8B5CF6" />
        </SectionCard>

        {/* Technical areas */}
        <SectionCard title="Technical Knowledge to Prepare" icon={BookOpen} accent="#06B6D4">
          <BulletList items={b.technicalAreas} icon={ChevronRight} color="#06B6D4" />
        </SectionCard>

        {/* Commercial themes */}
        <SectionCard title="Commercial Awareness Themes" icon={TrendingUp} accent="#F97316">
          <BulletList items={b.commercialThemes} icon={ChevronRight} color="#F97316" />
        </SectionCard>

        {/* ATS recommendations */}
        <SectionCard title="ATS Keywords for Your CV" icon={BarChart3} accent="#10B981">
          <TagList items={b.atsRecommendations} color="#10B981" />
        </SectionCard>

        {/* Gap analysis */}
        <SectionCard title="Common Gaps to Address" icon={AlertCircle} accent="#F43F5E">
          <BulletList items={b.gapAnalysis} icon={AlertCircle} color="#F43F5E" />
        </SectionCard>
      </div>

      {/* Likely interview stages */}
      {b.likelyInterviewStages.length > 0 && (
        <div className="bg-white rounded-2xl border border-surface-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#EEE9FF" }}>
              <Clock className="w-4 h-4" style={{ color: "#6D5EF3" }} />
            </div>
            <h3 className="text-sm font-semibold text-ink">Likely Recruitment Stages</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {b.likelyInterviewStages.map((stage, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl text-xs font-medium bg-surface-muted text-ink border border-surface-border">{stage}</span>
                {i < b.likelyInterviewStages.length - 1 && <ChevronRight className="w-3 h-3 text-ink-faint flex-shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prep roadmap */}
      {b.prepRoadmap.length > 0 && (
        <div className="bg-white rounded-2xl border border-surface-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#FFF7ED" }}>
              <Calendar className="w-4 h-4 text-orange-500" />
            </div>
            <h3 className="text-sm font-semibold text-ink">Preparation Roadmap</h3>
          </div>
          <div className="space-y-4">
            {b.prepRoadmap.map((phase, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: "#6D5EF3" }}>{i + 1}</div>
                  {i < b.prepRoadmap.length - 1 && <div className="w-0.5 flex-1 bg-surface-border mt-1" />}
                </div>
                <div className="pb-4 flex-1">
                  <p className="text-sm font-semibold text-ink mb-2">{phase.period}</p>
                  <ul className="space-y-1.5">
                    {phase.tasks.map((task, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-ink-muted">
                        <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-emerald-500" /> {task}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Interview Prep Tab ───────────────────────────────────────────────────────

function InterviewTab({ app }: { app: TrackerApp }) {
  const b = app.breakdown
  if (!b) return <EmptyBreakdown />
  return (
    <div className="space-y-5">
      {b.assessmentCentreExpectations.length > 0 && (
        <SectionCard title="Assessment Centre Expectations" icon={Target} accent="#F59E0B">
          <BulletList items={b.assessmentCentreExpectations} icon={CheckCircle} color="#F59E0B" />
        </SectionCard>
      )}
      <div className="bg-white rounded-2xl border border-surface-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#EEE9FF" }}>
            <MessageSquare className="w-4 h-4" style={{ color: "#6D5EF3" }} />
          </div>
          <h3 className="text-sm font-semibold text-ink">Likely Interview Questions</h3>
        </div>
        <div className="space-y-3">
          {b.interviewQuestions.map((q, i) => (
            <div key={i} className="rounded-xl border border-surface-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#EEE9FF", color: "#6D5EF3" }}>{q.competency}</span>
              </div>
              <p className="text-sm text-ink">{q.question}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Brain className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900">Interview Tip</p>
            <p className="text-xs text-blue-700 mt-1">For each question, prepare a concise STAR answer (90–120 seconds). Practice out loud — fluency matters as much as content. Use the STAR Builder module to rehearse these specific competencies.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── STAR Stories Tab ─────────────────────────────────────────────────────────

function StarTab({ app }: { app: TrackerApp }) {
  const b = app.breakdown
  if (!b) return <EmptyBreakdown />
  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-2">
        <div className="flex items-start gap-3">
          <Star className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">These are AI-suggested STAR story angles based on the competencies this company is likely to assess. Use the STAR Builder module to develop and refine each story.</p>
        </div>
      </div>
      {b.starSuggestions.map((s, i) => (
        <div key={i} className="bg-white rounded-2xl border border-surface-border p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "#F59E0B" }}>{i + 1}</div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FFFBEB", color: "#B45309", border: "1px solid #FDE68A" }}>{s.competency}</span>
          </div>
          <p className="text-sm text-ink-muted leading-relaxed">{s.suggestion}</p>
          <a href="/star-builder" className="mt-3 flex items-center gap-1.5 text-xs font-medium" style={{ color: "#6D5EF3" }}>
            <Sparkles className="w-3 h-3" /> Practice this in STAR Builder →
          </a>
        </div>
      ))}
    </div>
  )
}

// ─── Notes Tab ───────────────────────────────────────────────────────────────

function NotesTab({ app, onSave }: { app: TrackerApp; onSave: (updates: Partial<TrackerApp>) => void }) {
  const [notes, setNotes] = useState(app.notes ?? "")
  const [recruiterName, setRecruiterName] = useState(app.recruiterName ?? "")
  const [recruiterEmail, setRecruiterEmail] = useState(app.recruiterEmail ?? "")
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    onSave({ notes, recruiterName, recruiterEmail })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-surface-border p-5">
        <h3 className="text-sm font-semibold text-ink mb-3">Recruiter Contact</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-ink-faint mb-1">Name</label>
            <input className="w-full px-3 py-2.5 text-sm border border-surface-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-purple/30" placeholder="Recruiter name" value={recruiterName} onChange={e => setRecruiterName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-ink-faint mb-1">Email</label>
            <input type="email" className="w-full px-3 py-2.5 text-sm border border-surface-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-purple/30" placeholder="recruiter@firm.com" value={recruiterEmail} onChange={e => setRecruiterEmail(e.target.value)} />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-surface-border p-5">
        <h3 className="text-sm font-semibold text-ink mb-3">Notes</h3>
        <textarea
          className="w-full px-4 py-3 text-sm border border-surface-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-purple/30 resize-none"
          rows={10}
          placeholder="Add interview feedback, preparation notes, networking interactions, follow-up reminders…"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>
      <button onClick={handleSave}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
        style={{ background: "linear-gradient(135deg,#6D5EF3,#5B8DEF)" }}
      >
        {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <>Save Notes</>}
      </button>
    </div>
  )
}

// ─── Timeline Tab ─────────────────────────────────────────────────────────────

function TimelineTab({ app }: { app: TrackerApp }) {
  return (
    <div className="bg-white rounded-2xl border border-surface-border p-5">
      <h3 className="text-sm font-semibold text-ink mb-5">Stage History</h3>
      <div className="space-y-0">
        {[...app.stageHistory].reverse().map((entry, i) => {
          const s = getStage(entry.stage)
          return (
            <div key={i} className="flex gap-4 pb-5">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-white shadow" style={{ backgroundColor: s.color }}>
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                {i < app.stageHistory.length - 1 && <div className="w-0.5 flex-1 bg-surface-border mt-1" />}
              </div>
              <div className="flex-1 pt-1">
                <p className="text-sm font-semibold text-ink">{s.label}</p>
                <p className="text-xs text-ink-faint mt-0.5">{fmtDate(entry.date)}</p>
                {entry.note && <p className="text-xs text-ink-muted mt-1">{entry.note}</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EmptyBreakdown() {
  return (
    <div className="text-center py-12 text-ink-faint">
      <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-30" />
      <p className="text-sm">Generate the AI Breakdown first to unlock this section.</p>
      <p className="text-xs mt-1 opacity-70">Go to the AI Breakdown tab and click "Generate AI Breakdown"</p>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TrackerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [app, setApp] = useState<TrackerApp | null>(null)
  const [tab, setTab] = useState<Tab>("overview")
  const [stageOpen, setStageOpen] = useState(false)

  useEffect(() => {
    const a = getApp(id)
    if (!a) router.push("/tracker")
    else setApp(a)
  }, [id, router])

  const refresh = () => setApp(getApp(id))

  const handleStageChange = (stage: Stage) => {
    moveToStage(id, stage)
    refresh()
    setStageOpen(false)
  }

  const handleUpdate = (updates: Partial<TrackerApp>) => {
    updateApp(id, updates)
    refresh()
  }

  const handleBreakdown = (breakdown: RoleBreakdown) => {
    saveBreakdown(id, breakdown)
    refresh()
  }

  if (!app) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-ink-faint" />
      </div>
    )
  }

  const stage = getStage(app.stage)
  const color = companyColor(app.company)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-surface-border bg-white">
        <button onClick={() => router.push("/tracker")} className="flex items-center gap-2 text-xs text-ink-muted hover:text-ink mb-4 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Pipeline
        </button>

        <div className="flex items-start gap-4 flex-wrap">
          {/* Company avatar */}
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0" style={{ backgroundColor: color }}>
            {app.company[0]?.toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-ink">{app.role}</h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-sm font-medium text-ink-muted">{app.company}</span>
              {app.location && <span className="flex items-center gap-1 text-xs text-ink-faint"><MapPin className="w-3 h-3" />{app.location}</span>}
              {app.salary && <span className="flex items-center gap-1 text-xs text-ink-faint"><Briefcase className="w-3 h-3" />{app.salary}</span>}
              {app.deadline && (() => {
                const d = Math.ceil((new Date(app.deadline).getTime() - Date.now()) / 86400000)
                return <span className={cn("flex items-center gap-1 text-xs font-medium", d <= 7 ? "text-red-600" : "text-ink-faint")}><Calendar className="w-3 h-3" />{d <= 0 ? "Closed" : `${d}d to deadline`}</span>
              })()}
            </div>
          </div>

          {/* Stage selector */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setStageOpen(o => !o)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border font-medium text-sm transition-all"
              style={{ backgroundColor: stage.bg, color: stage.text, borderColor: stage.border }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
              {stage.label} <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <AnimatePresence>
              {stageOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                  className="absolute right-0 top-full mt-1 w-56 bg-white rounded-2xl border border-surface-border shadow-xl z-20 py-2 overflow-hidden"
                >
                  {STAGES.map(s => (
                    <button key={s.id} onClick={() => handleStageChange(s.id)}
                      className={cn("w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors", s.id === app.stage ? "bg-surface-muted font-semibold" : "hover:bg-surface-muted")}
                    >
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                      <span>{s.label}</span>
                      {s.id === app.stage && <CheckCircle className="w-3.5 h-3.5 ml-auto" style={{ color: s.color }} />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 px-6 pt-4 pb-0 border-b border-surface-border bg-white">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn("flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-medium whitespace-nowrap transition-all border-b-2", tab === t.id ? "border-brand-purple text-brand-purple bg-surface-muted" : "border-transparent text-ink-muted hover:text-ink")}
              style={tab === t.id ? { borderBottomColor: "#6D5EF3", color: "#6D5EF3" } : {}}
            >
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {tab === "overview"  && <OverviewTab app={app} />}
            {tab === "breakdown" && <BreakdownTab app={app} onBreakdownGenerated={handleBreakdown} />}
            {tab === "interview" && <InterviewTab app={app} />}
            {tab === "star"      && <StarTab app={app} />}
            {tab === "notes"     && <NotesTab app={app} onSave={handleUpdate} />}
            {tab === "timeline"  && <TimelineTab app={app} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

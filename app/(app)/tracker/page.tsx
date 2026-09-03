"use client"
import { useEffect, useState, useRef } from "react"
import { DATA_SYNCED_EVENT } from "@/lib/db/local"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Topbar } from "@/components/layout/topbar"
import { loadApps, addApp, moveToStage, deleteApp, createApp } from "@/lib/tracker/store"
import type { TrackerApp, Stage } from "@/lib/tracker/types"
import { STAGES, PIPELINE_STAGES, TERMINAL_STAGES, getStage, SECTORS } from "@/lib/tracker/types"
import {
  Plus, Target, Briefcase, Calendar, ChevronDown, Loader2, Sparkles,
  ExternalLink, Trash2, ArrowRight, CheckCircle, Clock, TrendingUp,
  X, AlertCircle, MapPin, Building2, Tag, Link2, FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── helpers ─────────────────────────────────────────────────────────────────

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / 86400000)
}

function fmtDeadline(dateStr?: string) {
  if (!dateStr) return null
  const days = daysUntil(dateStr)!
  if (days < 0) return { label: "Closed", urgent: false, over: true }
  if (days === 0) return { label: "Today!", urgent: true, over: false }
  if (days <= 7) return { label: `${days}d left`, urgent: true, over: false }
  return { label: new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" }), urgent: false, over: false }
}

function companyInitial(name: string) {
  return name.trim()[0]?.toUpperCase() ?? "?"
}

const COMPANY_COLORS = [
  "#6D5EF3", "#5B8DEF", "#10B981", "#F97316", "#EF4444",
  "#8B5CF6", "#06B6D4", "#F59E0B", "#EC4899", "#14B8A6",
]
function companyColor(name: string) {
  let hash = 0
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff
  return COMPANY_COLORS[Math.abs(hash) % COMPANY_COLORS.length]
}

function scoreColor(s: number) {
  if (s >= 75) return "#059669"
  if (s >= 60) return "#6D5EF3"
  if (s >= 40) return "#D97706"
  return "#EF4444"
}

// ─── ApplicationCard ─────────────────────────────────────────────────────────

function ApplicationCard({ app, onMove, onDelete, onClick }: {
  app: TrackerApp
  onMove: (stage: Stage) => void
  onDelete: () => void
  onClick: () => void
}) {
  const [moveOpen, setMoveOpen] = useState(false)
  const dl = fmtDeadline(app.deadline)
  const color = companyColor(app.company)
  const stage = getStage(app.stage)

  return (
    <div
      className="rounded-2xl p-4 transition-all cursor-pointer group relative"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
      onClick={onClick}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ backgroundColor: color }}
        >
          {companyInitial(app.company)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-tight truncate">{app.role}</p>
          <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.65)" }}>{app.company}</p>
        </div>
      </div>

      {/* Chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: stage.bg, color: stage.text, border: `1px solid ${stage.border}` }}>
          {app.sector}
        </span>
        {app.location && (
          <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <MapPin className="w-2.5 h-2.5" />{app.location}
          </span>
        )}
      </div>

      {/* Deadline */}
      {dl && (
        <div className={cn("flex items-center gap-1.5 text-xs mb-3", dl.urgent ? "text-red-400" : dl.over ? "" : "")}
          style={dl.over ? { color: "rgba(255,255,255,0.4)" } : dl.urgent ? {} : { color: "rgba(255,255,255,0.65)" }}>
          <Clock className="w-3 h-3" />
          <span className="font-medium">{dl.urgent && !dl.over ? "⚡ " : ""}{dl.label}</span>
        </div>
      )}

      {/* Readiness bar */}
      {app.readinessScore !== undefined && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Readiness</span>
            <span className="text-xs font-bold" style={{ color: scoreColor(app.readinessScore) }}>{app.readinessScore}/100</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${app.readinessScore}%`, backgroundColor: scoreColor(app.readinessScore) }} />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-2" onClick={e => e.stopPropagation()}>
        {/* Move stage */}
        <div className="relative flex-1">
          <button
            onClick={() => setMoveOpen(o => !o)}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 px-3 rounded-lg transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.65)", background: "rgba(255,255,255,0.04)" }}
          >
            Move <ChevronDown className="w-3 h-3" />
          </button>
          <AnimatePresence>
            {moveOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="absolute bottom-full left-0 mb-1 w-52 rounded-xl z-20 py-1 overflow-hidden"
                style={{ background: "rgba(10,18,35,0.97)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
              >
                {STAGES.filter(s => s.id !== app.stage).map(s => (
                  <button
                    key={s.id}
                    onClick={() => { onMove(s.id); setMoveOpen(false) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors"
                    style={{ color: "rgba(255,255,255,0.65)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                    {s.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={e => { e.stopPropagation(); onClick() }}
          className="flex items-center justify-center p-1.5 rounded-lg transition-colors"
          style={{ color: "rgba(255,255,255,0.4)" }}
          onMouseEnter={e => { e.currentTarget.style.color = "#8B5CF6"; e.currentTarget.style.background = "rgba(139,92,246,0.1)" }}
          onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; e.currentTarget.style.background = "transparent" }}
          title="View details"
        >
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          className="flex items-center justify-center p-1.5 rounded-lg transition-colors"
          style={{ color: "rgba(255,255,255,0.4)" }}
          onMouseEnter={e => { e.currentTarget.style.color = "#F87171"; e.currentTarget.style.background = "rgba(248,113,113,0.1)" }}
          onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; e.currentTarget.style.background = "transparent" }}
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── StageColumn ─────────────────────────────────────────────────────────────

function StageColumn({ stage, apps, onMove, onDelete, onCardClick, onAddToStage }: {
  stage: typeof PIPELINE_STAGES[number]
  apps: TrackerApp[]
  onMove: (appId: string, stage: Stage) => void
  onDelete: (appId: string) => void
  onCardClick: (id: string) => void
  onAddToStage: (stage: Stage) => void
}) {
  return (
    <div className="flex-shrink-0 w-[260px] flex flex-col">
      {/* Column header */}
      <div className="flex items-center gap-2 px-1 mb-3">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color }} />
        <span className="text-xs font-semibold text-white flex-1 truncate">{stage.label}</span>
        <span className="text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: stage.bg, color: stage.text }}>
          {apps.length}
        </span>
      </div>

      {/* Drop zone / cards */}
      <div className="flex-1 space-y-3 min-h-[80px]">
        {apps.map(app => (
          <ApplicationCard
            key={app.id}
            app={app}
            onMove={stage => onMove(app.id, stage)}
            onDelete={() => onDelete(app.id)}
            onClick={() => onCardClick(app.id)}
          />
        ))}
      </div>

      {/* Add to this stage */}
      <button
        onClick={() => onAddToStage(stage.id)}
        className="mt-3 flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-xs font-medium transition-all"
        style={{ border: "2px dashed rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", background: "transparent" }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "rgba(255,255,255,0.65)" }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)" }}
      >
        <Plus className="w-3.5 h-3.5" /> Add here
      </button>
    </div>
  )
}

// ─── AddOpportunityModal ──────────────────────────────────────────────────────

function AddOpportunityModal({ open, defaultStage, onClose, onSave }: {
  open: boolean
  defaultStage: Stage
  onClose: () => void
  onSave: (app: TrackerApp) => void
}) {
  const [tab, setTab] = useState<"paste" | "manual">("paste")
  const [jdText, setJdText] = useState("")
  const [url, setUrl] = useState("")
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState("")
  const [form, setForm] = useState<{
    company: string; role: string; sector: string; department: string
    location: string; workType: string; salary: string; deadline: string
    skills: string; softSkills: string; responsibilities: string; requirements: string
  }>({
    company: "", role: "", sector: "Consulting", department: "",
    location: "", workType: "", salary: "", deadline: "",
    skills: "", softSkills: "", responsibilities: "", requirements: "",
  })
  const [stage, setStage] = useState<Stage>(defaultStage)
  const [saving, setSaving] = useState(false)

  useEffect(() => { setStage(defaultStage) }, [defaultStage])
  useEffect(() => {
    if (!open) {
      setJdText(""); setUrl(""); setForm({ company: "", role: "", sector: "Consulting", department: "", location: "", workType: "", salary: "", deadline: "", skills: "", softSkills: "", responsibilities: "", requirements: "" })
      setExtractError(""); setTab("paste"); setSaving(false)
    }
  }, [open])

  const handleExtract = async () => {
    const text = jdText.trim() || url.trim()
    if (!text) return
    setExtracting(true); setExtractError("")
    try {
      const res = await fetch("/api/ai/tracker/extract-role", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setForm({
        company: data.company ?? "",
        role: data.role ?? "",
        sector: data.sector ?? "Other",
        department: data.department ?? "",
        location: data.location ?? "",
        workType: data.workType ?? "",
        salary: data.salary ?? "",
        deadline: data.deadline ?? "",
        skills: (data.skills ?? []).join(", "),
        softSkills: (data.softSkills ?? []).join(", "),
        responsibilities: (data.responsibilities ?? []).join("\n"),
        requirements: (data.requirements ?? []).join(", "),
      })
      setTab("manual")
    } catch (e: any) {
      setExtractError(e.message || "Extraction failed. Please fill in manually.")
    } finally {
      setExtracting(false)
    }
  }

  const handleSave = () => {
    if (!form.company || !form.role) return
    setSaving(true)
    const app = createApp({
      company: form.company.trim(),
      role: form.role.trim(),
      sector: form.sector,
      department: form.department || undefined,
      location: form.location || undefined,
      workType: (form.workType as any) || undefined,
      salary: form.salary || undefined,
      deadline: form.deadline || undefined,
      url: url || undefined,
      jobDescription: jdText || undefined,
      skills: form.skills ? form.skills.split(",").map(s => s.trim()).filter(Boolean) : [],
      softSkills: form.softSkills ? form.softSkills.split(",").map(s => s.trim()).filter(Boolean) : [],
      responsibilities: form.responsibilities ? form.responsibilities.split("\n").map(s => s.trim()).filter(Boolean) : [],
      requirements: form.requirements ? form.requirements.split(",").map(s => s.trim()).filter(Boolean) : [],
      stage,
    })
    onSave(app)
    setSaving(false)
  }

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#ffffff",
    borderRadius: 12,
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
        <motion.div
          className="relative rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
          style={{ background: "#0A1225", border: "1px solid rgba(255,255,255,0.1)" }}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div>
              <h2 className="text-lg font-bold text-white">Add Opportunity</h2>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Paste a job description to let AI extract the details automatically</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl transition-colors" style={{ color: "rgba(255,255,255,0.4)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            ><X className="w-5 h-5" /></button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-6 pt-4 flex-shrink-0">
            {[{ id: "paste" as const, label: "✦ AI Extract from JD", icon: Sparkles }, { id: "manual" as const, label: "Manual Entry", icon: FileText }].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={tab === t.id
                  ? { background: "linear-gradient(135deg,#6D5EF3,#5B8DEF)", color: "#ffffff" }
                  : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.65)" }
                }
              >
                <t.icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {tab === "paste" ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-white mb-1.5">Job Description / URL</label>
                  <div className="relative">
                    <Link2 className="absolute left-3 top-3 w-4 h-4" style={{ color: "rgba(255,255,255,0.4)" }} />
                    <input
                      className="w-full pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                      style={{ ...inputStyle }}
                      placeholder="Paste job URL (optional)"
                      value={url}
                      onChange={e => setUrl(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white mb-1.5">Paste Job Description</label>
                  <textarea
                    className="w-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 resize-none"
                    style={{ ...inputStyle }}
                    rows={10}
                    placeholder="Paste the full job description here — role title, responsibilities, requirements, deadline, salary… AI will extract everything."
                    value={jdText}
                    onChange={e => setJdText(e.target.value)}
                  />
                </div>
                {extractError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl text-xs" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#F87171" }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {extractError}
                  </div>
                )}
                <button
                  onClick={handleExtract}
                  disabled={extracting || (!jdText.trim() && !url.trim())}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#6D5EF3,#5B8DEF)" }}
                >
                  {extracting ? <><Loader2 className="w-4 h-4 animate-spin" /> Extracting…</> : <><Sparkles className="w-4 h-4" /> AI Extract Details</>}
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">Company *</label>
                    <input className="w-full px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40" style={inputStyle} placeholder="e.g. Goldman Sachs" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">Role Title *</label>
                    <input className="w-full px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40" style={inputStyle} placeholder="e.g. Investment Banking Analyst" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">Sector</label>
                    <select className="w-full px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40" style={inputStyle} value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}>
                      {SECTORS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">Location</label>
                    <input className="w-full px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40" style={inputStyle} placeholder="e.g. London" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">Application Deadline</label>
                    <input type="date" className="w-full px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40" style={inputStyle} value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">Salary</label>
                    <input className="w-full px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40" style={inputStyle} placeholder="e.g. £45,000–£55,000" value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Key Skills <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: "normal" }}>(comma separated)</span></label>
                  <input className="w-full px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40" style={inputStyle} placeholder="e.g. Financial modelling, Excel, Python, Stakeholder management" value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Pipeline Stage</label>
                  <select className="w-full px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40" style={inputStyle} value={stage} onChange={e => setStage(e.target.value as Stage)}>
                    {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{ color: "rgba(255,255,255,0.5)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >Cancel</button>
            {tab === "manual" && (
              <button
                onClick={handleSave}
                disabled={!form.company || !form.role || saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#6D5EF3,#5B8DEF)" }}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Save Opportunity
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TrackerPage() {
  const router = useRouter()
  const [apps, setApps] = useState<TrackerApp[]>([])
  const [addOpen, setAddOpen] = useState(false)
  const [addStage, setAddStage] = useState<Stage>("saved")
  const [sectorFilter, setSectorFilter] = useState("All")
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const refresh = () => setApps(loadApps())
    window.addEventListener(DATA_SYNCED_EVENT, refresh)
    setApps(loadApps())
    setLoaded(true)
    return () => window.removeEventListener(DATA_SYNCED_EVENT, refresh)
  }, [])

  const filtered = sectorFilter === "All" ? apps : apps.filter(a => a.sector === sectorFilter)
  const pipeline = PIPELINE_STAGES.map(s => ({ stage: s, apps: filtered.filter(a => a.stage === s.id) }))
  const outcomes = TERMINAL_STAGES.map(s => ({ stage: s, apps: filtered.filter(a => a.stage === s.id) }))

  const stats = {
    active: apps.filter(a => !getStage(a.stage).terminal).length,
    interviews: apps.filter(a => ["first_interview", "assessment_centre", "final_interview", "video_interview"].includes(a.stage)).length,
    offers: apps.filter(a => a.stage === "offer").length,
  }

  const handleAdd = (app: TrackerApp) => {
    addApp(app)
    setApps(loadApps())
    setAddOpen(false)
    router.push(`/tracker/${app.id}`)
  }

  const handleMove = (appId: string, stage: Stage) => {
    moveToStage(appId, stage)
    setApps(loadApps())
  }

  const handleDelete = (appId: string) => {
    if (!confirm("Remove this application?")) return
    deleteApp(appId)
    setApps(loadApps())
  }

  const usedSectors = Array.from(new Set(apps.map(a => a.sector)))

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Application Tracker" />
      <div className="flex-1 overflow-hidden flex flex-col">

        {/* Stats + controls bar */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0 flex-wrap gap-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-4">
            {[
              { label: "Active", value: stats.active, icon: Target, color: "#6D5EF3" },
              { label: "Interviews", value: stats.interviews, icon: TrendingUp, color: "#F97316" },
              { label: "Offers", value: stats.offers, icon: CheckCircle, color: "#10B981" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-none">{value}</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Sector filter */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {["All", ...usedSectors].map(s => (
                <button
                  key={s}
                  onClick={() => setSectorFilter(s)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={sectorFilter === s
                    ? { background: "linear-gradient(135deg,#6D5EF3,#5B8DEF)", color: "#ffffff" }
                    : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.65)" }
                  }
                >
                  {s}
                </button>
              ))}
            </div>

            <button
              onClick={() => { setAddStage("saved"); setAddOpen(true) }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white flex-shrink-0 transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#6D5EF3,#5B8DEF)" }}
            >
              <Plus className="w-4 h-4" /> Add Opportunity
            </button>
          </div>
        </div>

        {/* Board */}
        {!loaded ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "rgba(255,255,255,0.4)" }} />
          </div>
        ) : apps.length === 0 ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
              style={{ background: "linear-gradient(135deg, rgba(109,94,243,0.2), rgba(91,141,239,0.2))", border: "1px solid rgba(109,94,243,0.3)" }}>
              <Target className="w-10 h-10" style={{ color: "#6D5EF3" }} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Your application pipeline starts here</h2>
            <p className="text-sm max-w-md mb-6 leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
              Add your first opportunity to track your progress, get AI-powered preparation plans, company insights, and land more offers.
            </p>
            <button
              onClick={() => { setAddStage("saved"); setAddOpen(true) }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#6D5EF3,#5B8DEF)" }}
            >
              <Plus className="w-4 h-4" /> Add Your First Opportunity
            </button>
          </div>
        ) : (
          <>
            {/* Kanban board — horizontal scroll */}
            <div className="flex-1 overflow-x-auto overflow-y-auto p-6">
              <div className="flex gap-4" style={{ minWidth: `${PIPELINE_STAGES.length * 276}px` }}>
                {pipeline.map(({ stage, apps: colApps }) => (
                  <StageColumn
                    key={stage.id}
                    stage={stage}
                    apps={colApps}
                    onMove={handleMove}
                    onDelete={handleDelete}
                    onCardClick={id => router.push(`/tracker/${id}`)}
                    onAddToStage={s => { setAddStage(s); setAddOpen(true) }}
                  />
                ))}
              </div>
            </div>

            {/* Outcomes strip */}
            {outcomes.some(o => o.apps.length > 0) && (
              <div className="flex-shrink-0 px-6 pb-5 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>Closed Applications</p>
                <div className="flex flex-wrap gap-3">
                  {outcomes.filter(o => o.apps.length > 0).map(({ stage, apps: outApps }) => (
                    <div key={stage.id} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium" style={{ backgroundColor: stage.bg, color: stage.text, borderColor: stage.border, border: `1px solid ${stage.border}` }}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                      {stage.label} ({outApps.length})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <AddOpportunityModal
        open={addOpen}
        defaultStage={addStage}
        onClose={() => setAddOpen(false)}
        onSave={handleAdd}
      />
    </div>
  )
}

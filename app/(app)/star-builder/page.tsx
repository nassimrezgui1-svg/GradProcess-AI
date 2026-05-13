"use client"
import { useState } from "react"
import { Topbar } from "@/components/layout/topbar"
import { STARBreakdown } from "@/components/star/star-breakdown"
import { FeedbackCard } from "@/components/shared/feedback-card"
import { competencies } from "@/lib/mock-data"
import { generateSTARScenario, STARAnalysis } from "@/lib/ai/service"
import { saveSTARScore } from "@/lib/scores"
import { cn, getScoreColor, getScoreLabel } from "@/lib/utils"
import {
  Loader2, ChevronDown, MessageSquare, Lightbulb, AlertTriangle,
  Copy, Check, Plus, Trash2, Zap, Clock, ChevronRight, ArrowRight, X
} from "lucide-react"

interface Experience {
  id: string
  text: string
}

interface GeneratedScenario {
  id: string
  experienceId: string
  experienceText: string
  competency: string
  result: STARAnalysis
}

export default function STARBuilderPage() {
  const [experiences, setExperiences] = useState<Experience[]>([
    { id: "e1", text: "Led a team of 5 students to organise a charity fundraiser that raised £3,000" },
    { id: "e2", text: "Resolved a conflict between two team members during a group project deadline" },
    { id: "e3", text: "Identified an error in a client report 2 hours before a board presentation at my internship" },
  ])
  const [newExperience, setNewExperience] = useState("")
  const [selectedExperienceId, setSelectedExperienceId] = useState<string | null>(null)
  const [competency, setCompetency] = useState("Leadership")
  const [loading, setLoading] = useState(false)
  const [loadingExperienceId, setLoadingExperienceId] = useState<string | null>(null)
  const [scenarios, setScenarios] = useState<GeneratedScenario[]>([])
  const [activeScenario, setActiveScenario] = useState<GeneratedScenario | null>(null)
  const [activeVersionTab, setActiveVersionTab] = useState<"60s" | "90s" | "2min" | "full">("full")
  const [copied, setCopied] = useState(false)

  const addExperience = () => {
    if (!newExperience.trim()) return
    setExperiences(prev => [...prev, { id: `e-${Date.now()}`, text: newExperience.trim() }])
    setNewExperience("")
  }

  const removeExperience = (id: string) => {
    setExperiences(prev => prev.filter(e => e.id !== id))
    if (selectedExperienceId === id) setSelectedExperienceId(null)
  }

  const handleGenerate = async (exp: Experience) => {
    setLoadingExperienceId(exp.id)
    setLoading(true)
    try {
      const result = await generateSTARScenario(exp.text, competency)
      const newScenario: GeneratedScenario = {
        id: `s-${Date.now()}`,
        experienceId: exp.id,
        experienceText: exp.text,
        competency,
        result,
      }
      setScenarios(prev => [newScenario, ...prev])
      setActiveScenario(newScenario)
      saveSTARScore({ score: result.score, competency, experienceText: exp.text.slice(0, 100), date: new Date().toISOString() })
    } finally {
      setLoading(false)
      setLoadingExperienceId(null)
    }
  }

  const getVersionText = (scenario: GeneratedScenario) => {
    switch (activeVersionTab) {
      case "60s": return scenario.result.version60s
      case "90s": return scenario.result.version90s
      case "2min": return scenario.result.version2min
      default: return scenario.result.improvedVersion
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col min-h-full">
      <Topbar title="STAR Answer Builder" />
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full">

          {/* LEFT: Experience bank + controls */}
          <div className="lg:col-span-2 space-y-5">

            {/* Competency selector */}
            <div className="bg-white rounded-2xl border border-surface-border p-5">
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
                Competency to Build
              </label>
              <div className="relative">
                <select
                  value={competency}
                  onChange={e => setCompetency(e.target.value)}
                  className="w-full px-4 py-3 border border-surface-border rounded-xl text-sm text-gray-800 font-medium bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {competencies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint pointer-events-none" />
              </div>
              <p className="text-xs text-ink-faint mt-2">
                Select the competency, then click <strong>Generate STAR</strong> on any experience below.
              </p>
            </div>

            {/* Experience bank */}
            <div className="bg-white rounded-2xl border border-surface-border p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-ink">Your Experiences</h3>
                  <p className="text-xs text-ink-faint mt-0.5">Add bullet points, situations, or achievements from your life</p>
                </div>
                <span className="text-xs bg-surface-muted text-ink-muted px-2 py-1 rounded-full font-medium">
                  {experiences.length}
                </span>
              </div>

              {/* Add new experience */}
              <div className="mb-4">
                <textarea
                  value={newExperience}
                  onChange={e => setNewExperience(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && e.metaKey) addExperience() }}
                  placeholder="e.g. Managed a team of 4 to deliver a project under a tight deadline..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-surface-border rounded-xl text-sm text-ink resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-ink-faint"
                />
                <button
                  onClick={addExperience}
                  disabled={!newExperience.trim()}
                  className={cn(
                    "mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-colors",
                    newExperience.trim()
                      ? "bg-gray-900 text-white hover:bg-gray-700"
                      : "bg-surface-muted text-ink-faint cursor-not-allowed"
                  )}
                >
                  <Plus className="w-4 h-4" /> Add Experience
                </button>
              </div>

              {/* Experience list */}
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {experiences.map(exp => {
                  const isGenerating = loadingExperienceId === exp.id
                  const hasScenario = scenarios.some(s => s.experienceId === exp.id && s.competency === competency)
                  return (
                    <div
                      key={exp.id}
                      className={cn(
                        "rounded-xl border-2 p-3 transition-all",
                        activeScenario?.experienceId === exp.id && activeScenario?.competency === competency
                          ? "border-blue-400 bg-blue-50"
                          : "border-surface-border bg-surface-muted hover:border-surface-border"
                      )}
                    >
                      <p className="text-sm text-ink leading-relaxed mb-3">{exp.text}</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleGenerate(exp)}
                          disabled={loading}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                            loading && loadingExperienceId !== exp.id
                              ? "bg-gray-200 text-ink-faint cursor-not-allowed"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          )}
                        >
                          {isGenerating
                            ? <><Loader2 className="w-3 h-3 animate-spin" /> Generating...</>
                            : <><Zap className="w-3 h-3" /> Generate STAR</>}
                        </button>
                        {hasScenario && (
                          <button
                            onClick={() => {
                              const s = scenarios.find(s => s.experienceId === exp.id && s.competency === competency)
                              if (s) setActiveScenario(s)
                            }}
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 px-2 py-1.5 rounded-lg bg-blue-50 font-medium"
                          >
                            View <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => removeExperience(exp.id)}
                          className="p-1.5 text-ink-faint hover:text-red-500 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )
                })}
                {experiences.length === 0 && (
                  <div className="text-center py-8 text-ink-faint">
                    <p className="text-sm">No experiences added yet.</p>
                    <p className="text-xs mt-1">Add a bullet point above to get started.</p>
                  </div>
                )}
              </div>
            </div>

            {/* All generated scenarios */}
            {scenarios.length > 0 && (
              <div className="bg-white rounded-2xl border border-surface-border p-5">
                <h3 className="text-sm font-semibold text-ink mb-3">Generated Scenarios ({scenarios.length})</h3>
                <div className="space-y-2">
                  {scenarios.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setActiveScenario(s)}
                      className={cn(
                        "w-full text-left p-3 rounded-xl border-2 transition-all",
                        activeScenario?.id === s.id
                          ? "border-blue-400 bg-blue-50"
                          : "border-surface-border hover:border-surface-border"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-blue-700">{s.competency}</span>
                        <span className={cn("text-xs font-bold", getScoreColor(s.result.score))}>{s.result.score}/100</span>
                      </div>
                      <p className="text-xs text-ink-muted truncate">{s.experienceText}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: STAR result */}
          <div className="lg:col-span-3 space-y-5">
            {!activeScenario ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-surface-border flex flex-col items-center justify-center p-16 text-center h-full min-h-[400px]">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                  <Zap className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="text-base font-semibold text-ink mb-2">No STAR answer generated yet</h3>
                <p className="text-sm text-ink-faint max-w-xs">
                  Select a competency on the left, then click <strong>Generate STAR</strong> on any of your experiences.
                </p>
                <div className="flex items-center gap-2 mt-6 text-xs text-ink-faint">
                  <span>Add experience</span>
                  <ArrowRight className="w-3 h-3" />
                  <span>Pick competency</span>
                  <ArrowRight className="w-3 h-3" />
                  <span>Generate STAR</span>
                </div>
              </div>
            ) : (
              <>
                {/* Score header */}
                <div className="bg-white rounded-2xl border border-surface-border p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-semibold text-white bg-blue-600 px-3 py-1 rounded-full">
                          {activeScenario.competency}
                        </span>
                        <span className={cn("text-xs font-semibold", getScoreColor(activeScenario.result.score))}>
                          {getScoreLabel(activeScenario.result.score)}
                        </span>
                      </div>
                      <p className="text-xs text-ink-faint mt-2 italic line-clamp-2">
                        Based on: "{activeScenario.experienceText}"
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-center">
                      <div className={cn("text-4xl font-bold", getScoreColor(activeScenario.result.score))}>
                        {activeScenario.result.score}
                      </div>
                      <div className="text-xs text-ink-faint">/100</div>
                    </div>
                  </div>
                  {/* STAR completeness bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-ink-muted mb-1">
                      <span>STAR Completeness</span>
                      <span className="font-semibold">{activeScenario.result.starCompleteness}%</span>
                    </div>
                    <div className="h-2 bg-surface-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-700"
                        style={{ width: `${activeScenario.result.starCompleteness}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* STAR breakdown */}
                <STARBreakdown
                  situation={activeScenario.result.situation}
                  task={activeScenario.result.task}
                  action={activeScenario.result.action}
                  result={activeScenario.result.result}
                />

                {/* Answer versions */}
                <div className="bg-white rounded-2xl border border-surface-border p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <h3 className="text-sm font-semibold text-ink">Polished Answer Versions</h3>
                    </div>
                    <button
                      onClick={() => handleCopy(getVersionText(activeScenario) || "")}
                      className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition-colors"
                    >
                      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <div className="flex gap-2 mb-4">
                    {(["full", "60s", "90s", "2min"] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveVersionTab(tab)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                          activeVersionTab === tab
                            ? "bg-blue-600 text-white"
                            : "bg-surface-muted text-ink-muted hover:bg-gray-200"
                        )}
                      >
                        {tab === "full" ? "Improved" : tab === "2min" ? "2 min" : tab}
                      </button>
                    ))}
                  </div>
                  <div className="bg-surface-muted rounded-xl p-4 border border-surface-border text-sm text-ink leading-relaxed">
                    {getVersionText(activeScenario) || "Not available"}
                  </div>
                </div>

                {/* Missing elements + improvements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeScenario.result.missingElements?.length > 0 && (
                    <FeedbackCard
                      type="warning"
                      title="Missing Elements"
                      items={activeScenario.result.missingElements}
                    />
                  )}
                  {activeScenario.result.improvements?.length > 0 && (
                    <FeedbackCard
                      type="info"
                      title="How to Improve"
                      items={activeScenario.result.improvements}
                    />
                  )}
                </div>

                {/* Follow-up questions */}
                {activeScenario.result.followUpQuestions?.length > 0 && (
                  <div className="bg-white rounded-2xl border border-surface-border p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare className="w-4 h-4 text-purple-500" />
                      <h3 className="text-sm font-semibold text-ink">Likely Interviewer Follow-Up Questions</h3>
                    </div>
                    <div className="space-y-2">
                      {activeScenario.result.followUpQuestions.map((q, i) => (
                        <div key={i} className="flex items-start gap-2 p-3 bg-purple-50 rounded-xl border border-purple-100">
                          <span className="w-5 h-5 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">Q</span>
                          <p className="text-sm text-ink">{q}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interviewer risk flags */}
                {activeScenario.result.interviewerRiskFlags?.length > 0 && (
                  <FeedbackCard
                    type="error"
                    title="Interviewer Risk Flags — Watch Out For These"
                    items={activeScenario.result.interviewerRiskFlags}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

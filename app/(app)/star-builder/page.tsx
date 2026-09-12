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
  Copy, Check, Plus, Trash2, Zap, Clock, ChevronRight, ArrowRight, X, AlertCircle} from "lucide-react"

interface Experience {
  id: string
  text: string
  /** Seeded illustration, not something the user did. Never presented as theirs. */
  example?: boolean
}

interface GeneratedScenario {
  id: string
  experienceId: string
  experienceText: string
  competency: string
  result: STARAnalysis
}

export default function STARBuilderPage() {
  // These are illustrations of the right level of detail, not the user's own
  // experiences. They were previously indistinguishable from entries the user
  // had added, so someone could generate a polished STAR answer from an
  // achievement they never had and take it into a real interview.
  const [experiences, setExperiences] = useState<Experience[]>([
    { id: "e1", text: "Led a team of 5 students to organise a charity fundraiser that raised £3,000", example: true },
    { id: "e2", text: "Resolved a conflict between two team members during a group project deadline", example: true },
    { id: "e3", text: "Identified an error in a client report 2 hours before a board presentation at my internship", example: true },
  ])
  const [newExperience, setNewExperience] = useState("")
  const [selectedExperienceId, setSelectedExperienceId] = useState<string | null>(null)
  const [competency, setCompetency] = useState("Leadership")
  const [loading, setLoading] = useState(false)
  const [loadingExperienceId, setLoadingExperienceId] = useState<string | null>(null)
  const [genError, setGenError] = useState("")
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
    setGenError("")
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
    } catch (e: any) {
      // try/finally with no catch meant a failed generation simply put the
      // button back with nothing shown: a 12 September audit recorded a 45s
      // timeout where the only trace was a console exception.
      setGenError(e?.message || "Could not generate that STAR answer. Please try again.")
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
            <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "rgba(255,255,255,0.62)" }}>
                Competency to Build
              </label>
              <div className="relative">
                <select
                  value={competency}
                  onChange={e => setCompetency(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#ffffff" }}
                >
                  {competencies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "rgba(255,255,255,0.4)" }} />
              </div>
              <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.62)" }}>
                Select the competency, then click <strong style={{ color: "rgba(255,255,255,0.65)" }}>Generate STAR</strong> on any experience below.
              </p>
            </div>

            {/* Experience bank */}
            <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">Your Experiences</h3>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.62)" }}>Add bullet points, situations, or achievements from your life</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.65)" }}>
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
                  className="w-full px-3 py-2.5 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#ffffff" }}
                />
                <button
                  onClick={addExperience}
                  disabled={!newExperience.trim()}
                  className={cn(
                    "mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-colors",
                  )}
                  style={newExperience.trim()
                    ? { background: "linear-gradient(135deg, #3F6FD8, #7C3AED)", color: "#ffffff" }
                    : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.62)", cursor: "not-allowed" }
                  }
                >
                  <Plus className="w-4 h-4" /> Add Experience
                </button>
              </div>

              {genError && (
                <div className="mb-3 rounded-xl p-3 flex items-start gap-2" role="alert"
                  style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)" }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#F87171" }} />
                  <p className="text-xs" style={{ color: "#FCA5A5" }}>{genError}</p>
                </div>
              )}

              {experiences.some(e => e.example) && (
                <p className="text-xs mb-2 leading-relaxed" style={{ color: "rgba(251,191,36,0.75)" }}>
                  The entries marked <strong>Example</strong> are samples showing the level of
                  detail that works well. Replace them with your own experiences — an answer
                  built from a sample is not yours to tell in an interview.
                </p>
              )}

              {/* Experience list */}
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {experiences.map(exp => {
                  const isGenerating = loadingExperienceId === exp.id
                  const hasScenario = scenarios.some(s => s.experienceId === exp.id && s.competency === competency)
                  const isActive = activeScenario?.experienceId === exp.id && activeScenario?.competency === competency
                  return (
                    <div
                      key={exp.id}
                      className="rounded-xl p-3 transition-all"
                      style={{
                        border: isActive ? "2px solid rgba(91,140,255,0.5)" : "2px solid rgba(255,255,255,0.08)",
                        background: isActive ? "rgba(91,140,255,0.08)" : "rgba(255,255,255,0.03)",
                      }}
                    >
                      {exp.example && (
                        <span className="inline-block mb-2 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
                          style={{ background: "rgba(251,191,36,0.15)", color: "#FBBF24", border: "1px solid rgba(251,191,36,0.3)" }}>
                          Example
                        </span>
                      )}
                      <p className="text-sm leading-relaxed mb-3" style={{ color: exp.example ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.65)" }}>{exp.text}</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleGenerate(exp)}
                          disabled={loading}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                          style={loading && loadingExperienceId !== exp.id
                            ? { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.62)", cursor: "not-allowed" }
                            : { background: "#5B8CFF", color: "#ffffff" }
                          }
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
                            className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg font-medium"
                            style={{ background: "rgba(91,140,255,0.15)", color: "#5B8CFF" }}
                          >
                            View <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => removeExperience(exp.id)}
                          className="p-1.5 rounded-lg transition-colors hover:text-red-400"
                          style={{ color: "rgba(255,255,255,0.62)" }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )
                })}
                {experiences.length === 0 && (
                  <div className="text-center py-8" style={{ color: "rgba(255,255,255,0.62)" }}>
                    <p className="text-sm">No experiences added yet.</p>
                    <p className="text-xs mt-1">Add a bullet point above to get started.</p>
                  </div>
                )}
              </div>
            </div>

            {/* All generated scenarios */}
            {scenarios.length > 0 && (
              <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <h3 className="text-sm font-semibold text-white mb-3">Generated Scenarios ({scenarios.length})</h3>
                <div className="space-y-2">
                  {scenarios.map(s => {
                    const isActive = activeScenario?.id === s.id
                    return (
                      <button
                        key={s.id}
                        onClick={() => setActiveScenario(s)}
                        className="w-full text-left p-3 rounded-xl transition-all"
                        style={{
                          border: isActive ? "2px solid rgba(91,140,255,0.4)" : "2px solid rgba(255,255,255,0.08)",
                          background: isActive ? "rgba(91,140,255,0.08)" : "transparent",
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold" style={{ color: "#5B8CFF" }}>{s.competency}</span>
                          <span className={cn("text-xs font-bold", getScoreColor(s.result.score))}>{s.result.score}/100</span>
                        </div>
                        <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.62)" }}>{s.experienceText}</p>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: STAR result */}
          <div className="lg:col-span-3 space-y-5">
            {!activeScenario ? (
              <div className="rounded-2xl flex flex-col items-center justify-center p-16 text-center h-full min-h-[400px]"
                style={{ border: "2px dashed rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(91,140,255,0.12)" }}>
                  <Zap className="w-7 h-7" style={{ color: "#5B8CFF" }} />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">No STAR answer generated yet</h3>
                <p className="text-sm max-w-xs" style={{ color: "rgba(255,255,255,0.62)" }}>
                  Select a competency on the left, then click <strong style={{ color: "rgba(255,255,255,0.65)" }}>Generate STAR</strong> on any of your experiences.
                </p>
                <div className="flex items-center gap-2 mt-6 text-xs" style={{ color: "rgba(255,255,255,0.62)" }}>
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
                <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-semibold text-white px-3 py-1 rounded-full" style={{ background: "#5B8CFF" }}>
                          {activeScenario.competency}
                        </span>
                        <span className={cn("text-xs font-semibold", getScoreColor(activeScenario.result.score))}>
                          {getScoreLabel(activeScenario.result.score)}
                        </span>
                      </div>
                      <p className="text-xs mt-2 italic line-clamp-2" style={{ color: "rgba(255,255,255,0.62)" }}>
                        Based on: "{activeScenario.experienceText}"
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-center">
                      <div className={cn("text-4xl font-bold", getScoreColor(activeScenario.result.score))}>
                        {activeScenario.result.score}
                      </div>
                      <div className="text-xs" style={{ color: "rgba(255,255,255,0.62)" }}>/100</div>
                    </div>
                  </div>
                  {/* STAR completeness bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1" style={{ color: "rgba(255,255,255,0.65)" }}>
                      <span>STAR Completeness</span>
                      <span className="font-semibold">{activeScenario.result.starCompleteness}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
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
                <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <h3 className="text-sm font-semibold text-white">Polished Answer Versions</h3>
                    </div>
                    <button
                      onClick={() => handleCopy(getVersionText(activeScenario) || "")}
                      className="flex items-center gap-1.5 text-xs transition-colors"
                      style={{ color: "rgba(255,255,255,0.62)" }}
                    >
                      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <div className="flex gap-2 mb-4">
                    {(["full", "60s", "90s", "2min"] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveVersionTab(tab)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                        style={activeVersionTab === tab
                          ? { background: "#5B8CFF", color: "#ffffff" }
                          : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.65)" }
                        }
                      >
                        {tab === "full" ? "Improved" : tab === "2min" ? "2 min" : tab}
                      </button>
                    ))}
                  </div>
                  <div className="rounded-xl p-4 text-sm leading-relaxed"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.65)" }}>
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
                  <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare className="w-4 h-4" style={{ color: "#8B5CF6" }} />
                      <h3 className="text-sm font-semibold text-white">Likely Interviewer Follow-Up Questions</h3>
                    </div>
                    <div className="space-y-2">
                      {activeScenario.result.followUpQuestions.map((q, i) => (
                        <div key={i} className="flex items-start gap-2 p-3 rounded-xl"
                          style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)" }}>
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 text-white"
                            style={{ background: "rgba(139,92,246,0.5)" }}>Q</span>
                          <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>{q}</p>
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

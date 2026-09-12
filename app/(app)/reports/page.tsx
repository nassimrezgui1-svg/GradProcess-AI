"use client"
import { useEffect, useState, useMemo } from "react"
import { DATA_SYNCED_EVENT } from "@/lib/db/local"
import { Topbar } from "@/components/layout/topbar"
import { ReadinessRadar } from "@/components/charts/readiness-radar"
import { ModuleBars } from "@/components/charts/module-bars"
import { loadDashboardScores, DashboardScores, VideoScoreEntry, CVScoreEntry, STARScoreEntry } from "@/lib/scores"
import { loadSessions } from "@/lib/interview/session-store"
import type { StoredSession } from "@/lib/interview/types"
import { cn, getScoreBand } from "@/lib/utils"
import {
  FileText, Mic2, Video, Brain, BarChart3, TrendingUp,
  CheckCircle, AlertCircle, Clock, Target, Zap, MessageSquare,
  ChevronDown, ChevronUp, Calendar, Activity,
} from "lucide-react"

function scoreColor(s: number) {
  if (s >= 75) return "#059669"
  if (s >= 60) return "#5B8DEF"
  if (s >= 40) return "#F59E0B"
  return "#F43F5E"
}
// Banding comes from lib/utils so every surface agrees (see getScoreBand).
const scoreBand = (s: number) => getScoreBand(s).label
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}
function fmtTime(s: number) {
  const m = Math.floor(s / 60); const sec = s % 60
  return `${m}m ${sec}s`
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <span className="text-lg font-bold" style={{ color: scoreColor(score) }}>{score}/100</span>
  )
}

function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="text-center py-10" style={{ color: "rgba(255,255,255,0.62)" }}>
      <Icon className="w-8 h-8 mx-auto mb-2 opacity-30" />
      <p className="text-sm">{message}</p>
      <p className="text-xs mt-1 opacity-70">Complete a session to see your data here</p>
    </div>
  )
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color?: string }) {
  return (
    <div className="rounded-2xl p-5 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <p className="text-2xl font-bold text-white" style={color ? { color } : {}}>{value}</p>
      <p className="text-xs font-medium mt-1 text-white">{label}</p>
      <p className="text-xs" style={{ color: "rgba(255,255,255,0.62)" }}>{sub}</p>
    </div>
  )
}

// ── Video interview session card (expandable) ─────────────────────────────────
function VideoSessionCard({ session }: { session: StoredSession }) {
  const [expanded, setExpanded] = useState(false)
  const r = session.report
  if (!r) return null
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <button onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-4 p-4 text-left transition-colors"
        style={{ background: "transparent" }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(139,92,246,0.15)" }}>
          <Video className="w-5 h-5" style={{ color: "#8B5CF6" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">{session.setup.sector} · {session.setup.mode}</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.62)" }}>{fmtDate(new Date(session.timestamp).toISOString())} · {session.setup.difficulty} · {session.answers.length} questions</p>
        </div>
        <div className="text-right flex-shrink-0 flex items-center gap-3">
          <div>
            <span className="text-xl font-bold" style={{ color: scoreColor(r.overallScore) }}>{r.overallScore}</span>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.62)" }}>/100</span>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4" style={{ color: "rgba(255,255,255,0.4)" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "rgba(255,255,255,0.4)" }} />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-3 space-y-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          {/* Score breakdown */}
          <div className="grid grid-cols-5 gap-2">
            {[
              { label: "Content", score: r.contentScore },
              { label: "STAR", score: r.starScore },
              { label: "Delivery", score: r.deliveryScore },
              { label: "Commercial", score: r.commercialScore },
              { label: "Comms", score: r.communicationScore },
            ].map(({ label, score }) => (
              <div key={label} className="text-center p-2 rounded-xl" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-xs mb-0.5" style={{ color: "rgba(255,255,255,0.62)" }}>{label}</p>
                <p className="text-sm font-bold" style={{ color: scoreColor(score) }}>{score}</p>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="flex gap-4 text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>
            <span>⏱ {fmtTime(r.totalDurationSeconds || 0)}</span>
            <span>💬 {r.totalFillerWords} fillers</span>
            <span>🎯 {r.avgWordsPerMinute} wpm avg</span>
          </div>

          {/* Recruiter feedback */}
          {r.recruiterFeedback && (
            <div className="rounded-xl p-3 text-sm leading-relaxed"
              style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)", color: "rgba(255,255,255,0.65)" }}>
              {r.recruiterFeedback}
            </div>
          )}

          {/* Strengths / Improvements */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold text-white mb-2">Strengths</p>
              <ul className="space-y-1">
                {(r.strengths || []).map((s: string, i: number) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-white mb-2">Improvements</p>
              <ul className="space-y-1">
                {(r.improvements || []).map((s: string, i: number) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Per-answer breakdown */}
          {session.answers.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-white mb-2">Answer Breakdown</p>
              <div className="space-y-1.5">
                {session.answers.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <span className="w-6 h-6 rounded-lg text-xs font-bold text-white flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: scoreColor(a.overallScore) }}>
                      {a.overallScore}
                    </span>
                    <p className="flex-1 text-xs text-white truncate">{a.questionText}</p>
                    <span className="text-xs flex-shrink-0" style={{ color: "rgba(255,255,255,0.62)" }}>{a.fillerWords?.total || 0} fillers</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [scores, setScores] = useState<DashboardScores | null>(null)
  const [interviewSessions, setInterviewSessions] = useState<StoredSession[]>([])
  const [activeTab, setActiveTab] = useState<"overview" | "interviews" | "cv" | "star" | "psychometric">("overview")

  useEffect(() => {
    const refresh = () => {
      setScores(loadDashboardScores())
      setInterviewSessions(loadSessions().filter(s => s.report !== null))
    }
    refresh()
    window.addEventListener(DATA_SYNCED_EVENT, refresh)
    return () => window.removeEventListener(DATA_SYNCED_EVENT, refresh)
  }, [])

  if (!scores) return null

  // Computed stats
  const totalSessions = (scores.videoLog?.length || 0) + (scores.cvLog?.length || 0) + (scores.starLog?.length || 0) + (scores.psychLog?.length || 0)
  const totalQuestions = (scores.starLog?.length || 0) + interviewSessions.reduce((s, sess) => s + sess.answers.length, 0)
  const totalStudyMins = interviewSessions.reduce((s, sess) => s + (sess.report?.totalDurationSeconds || 0), 0) / 60
  const avgVideoImprovement = (() => {
    const v = scores.videoLog || []
    if (v.length < 2) return null
    return v[0].score - v[v.length - 1].score
  })()

  const moduleData = useMemo(() => [
    { name: "CV & ATS", score: scores.cv ?? 0 },
    { name: "STAR", score: scores.star ?? 0 },
    { name: "Video Interview", score: scores.video ?? 0 },
    { name: "Psychometric", score: scores.psychometric ?? 0 },
  ], [scores]).filter(m => m.score > 0)

  const radarData = scores.radarData  // already a stable reference from loadDashboardScores

  const TABS = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "interviews", label: `Interviews (${interviewSessions.length})`, icon: Video },
    { id: "cv", label: `CV (${scores.cvLog?.length || 0})`, icon: FileText },
    { id: "star", label: `STAR (${scores.starLog?.length || 0})`, icon: Mic2 },
    { id: "psychometric", label: `Psychometric (${scores.psychLog?.length || 0})`, icon: Brain },
  ] as const

  return (
    <div className="flex flex-col min-h-full">
      <Topbar title="Reports & Analytics" />
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Overall Readiness"
            value={scores.overall !== null ? `${scores.overall}/100` : "—"}
            sub={scores.overall !== null ? scoreBand(scores.overall) : "No data yet"}
            color={scores.overall !== null ? scoreColor(scores.overall) : undefined}
          />
          <StatCard label="Practice Sessions" value={String(totalSessions)} sub="Across all modules" />
          <StatCard label="Questions Answered" value={String(totalQuestions)} sub="STAR + Interview" />
          <StatCard
            label="Interview Sessions"
            value={String(interviewSessions.length)}
            sub={avgVideoImprovement !== null ? `${avgVideoImprovement > 0 ? "+" : ""}${avgVideoImprovement}pts trend` : "Complete one to track"}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-2xl p-1 overflow-x-auto" style={{ background: "rgba(255,255,255,0.04)" }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex-shrink-0")}
              style={activeTab === tab.id
                ? { background: "rgba(255,255,255,0.08)", color: "#ffffff" }
                : { color: "rgba(255,255,255,0.5)" }
              }
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {totalSessions === 0 ? (
              <div className="rounded-2xl p-12 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <Activity className="w-12 h-12 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.2)" }} />
                <h3 className="text-base font-semibold text-white mb-1">No data yet</h3>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>Complete a CV analysis, STAR practice, interview, or psychometric test to see your analytics here.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Radar */}
                  <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <h3 className="text-sm font-semibold text-white mb-4">Skill Coverage Radar</h3>
                    {radarData.some(d => d.score > 0)
                      ? <ReadinessRadar data={radarData} />
                      : <EmptyState icon={Target} message="Complete modules to build your radar" />
                    }
                  </div>

                  {/* Module bars */}
                  <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <h3 className="text-sm font-semibold text-white mb-4">Module Score Breakdown</h3>
                    {moduleData.length > 0
                      ? <ModuleBars data={moduleData} />
                      : <EmptyState icon={BarChart3} message="Complete modules to see scores" />
                    }
                  </div>
                </div>

                {/* Recent activity */}
                <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <h3 className="text-sm font-semibold text-white mb-4">Recent Activity</h3>
                  {scores.recentSessions.length === 0 ? (
                    <EmptyState icon={Calendar} message="No sessions recorded yet" />
                  ) : (
                    <div className="space-y-2">
                      {scores.recentSessions.map((s, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: s.score >= 75 ? "rgba(52,211,153,0.15)" : s.score >= 60 ? "rgba(91,140,255,0.15)" : "rgba(251,191,36,0.15)" }}>
                            <span className="text-xs font-bold" style={{ color: scoreColor(s.score) }}>{s.score}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{s.label}</p>
                            <p className="text-xs" style={{ color: "rgba(255,255,255,0.62)" }}>{fmtDate(s.date)}</p>
                          </div>
                          <span className="text-xs font-semibold" style={{ color: scoreColor(s.score) }}>{s.score}/100</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Weakest / Strongest */}
                {(scores.weakest || scores.strongest) && (
                  <div className="grid grid-cols-2 gap-4">
                    {scores.weakest && (
                      <div className="rounded-2xl p-5" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
                        <p className="text-xs font-semibold mb-1 flex items-center gap-1.5" style={{ color: "#FBBF24" }}>
                          <AlertCircle className="w-3.5 h-3.5" /> Priority Focus
                        </p>
                        <p className="text-base font-bold text-white">{scores.weakest.label}</p>
                        <p className="text-2xl font-bold mt-1" style={{ color: "#FBBF24" }}>{scores.weakest.score}/100</p>
                        <p className="text-xs mt-1" style={{ color: "rgba(251,191,36,0.8)" }}>Your biggest improvement opportunity</p>
                      </div>
                    )}
                    {scores.strongest && (
                      <div className="rounded-2xl p-5" style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)" }}>
                        <p className="text-xs font-semibold mb-1 flex items-center gap-1.5" style={{ color: "#34D399" }}>
                          <CheckCircle className="w-3.5 h-3.5" /> Biggest Strength
                        </p>
                        <p className="text-base font-bold text-white">{scores.strongest.label}</p>
                        <p className="text-2xl font-bold mt-1" style={{ color: "#34D399" }}>{scores.strongest.score}/100</p>
                        <p className="text-xs mt-1" style={{ color: "rgba(52,211,153,0.8)" }}>Keep building on this</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── INTERVIEWS ── */}
        {activeTab === "interviews" && (
          <div className="space-y-4">
            {interviewSessions.length === 0 ? (
              <div className="rounded-2xl p-12 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <EmptyState icon={Video} message="No completed interview sessions yet" />
              </div>
            ) : (
              <>
                {/* Aggregate stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(() => {
                    const reports = interviewSessions.map(s => s.report!)
                    const avgOverall = Math.round(reports.reduce((s, r) => s + r.overallScore, 0) / reports.length)
                    const avgStar = Math.round(reports.reduce((s, r) => s + r.starScore, 0) / reports.length)
                    const avgDelivery = Math.round(reports.reduce((s, r) => s + r.deliveryScore, 0) / reports.length)
                    const totalFillers = reports.reduce((s, r) => s + (r.totalFillerWords || 0), 0)
                    return [
                      { label: "Avg Overall", value: `${avgOverall}`, sub: scoreBand(avgOverall), color: scoreColor(avgOverall) },
                      { label: "Avg STAR", value: `${avgStar}`, sub: "Structure score", color: scoreColor(avgStar) },
                      { label: "Avg Delivery", value: `${avgDelivery}`, sub: "Pace & clarity", color: scoreColor(avgDelivery) },
                      { label: "Total Fillers", value: String(totalFillers), sub: `Across ${reports.length} sessions` },
                    ].map(s => <StatCard key={s.label} {...s} />)
                  })()}
                </div>

                {/* Session list */}
                <div className="space-y-3">
                  {interviewSessions.map(session => (
                    <VideoSessionCard key={session.id} session={session} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── CV ── */}
        {activeTab === "cv" && (
          <div className="space-y-4">
            {(!scores.cvLog || scores.cvLog.length === 0) ? (
              <div className="rounded-2xl p-12 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <EmptyState icon={FileText} message="No CV analyses yet — go to CV Tailoring to get started" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <StatCard
                    label="Latest Score"
                    value={`${scores.cvLog[0].score}/100`}
                    sub={scoreBand(scores.cvLog[0].score)}
                    color={scoreColor(scores.cvLog[0].score)}
                  />
                  <StatCard
                    label="Best Score"
                    value={`${Math.max(...scores.cvLog.map(e => e.score))}/100`}
                    sub="All time high"
                    color="#059669"
                  />
                  <StatCard label="Analyses" value={String(scores.cvLog.length)} sub="Total runs" />
                </div>
                <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {scores.cvLog.map((entry: CVScoreEntry, i: number) => (
                    <div key={i} className="flex items-center gap-4 p-4" style={{ borderBottom: i < scores.cvLog!.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <FileText className="w-5 h-5" style={{ color: "rgba(255,255,255,0.4)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">CV Analysis</p>
                        <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.62)" }}>{entry.jobSpec || "General analysis"} · {fmtDate(entry.date)}</p>
                      </div>
                      <ScoreBadge score={entry.score} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── STAR ── */}
        {activeTab === "star" && (
          <div className="space-y-4">
            {(!scores.starLog || scores.starLog.length === 0) ? (
              <div className="rounded-2xl p-12 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <EmptyState icon={Mic2} message="No STAR answers yet — go to STAR Builder to practise" />
              </div>
            ) : (
              <>
                {(() => {
                  const byComp: Record<string, number[]> = {}
                  scores.starLog.forEach((e: STARScoreEntry) => {
                    if (!byComp[e.competency]) byComp[e.competency] = []
                    byComp[e.competency].push(e.score)
                  })
                  // eslint-disable-next-line react-hooks/rules-of-hooks
                  const compData = Object.entries(byComp).map(([name, scores]) => ({
                    name, score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
                  })).sort((a, b) => a.score - b.score)
                  return (
                    <>
                      <div className="grid grid-cols-3 gap-3">
                        <StatCard label="Avg STAR Score" value={`${scores.star}/100`} sub={scoreBand(scores.star!)} color={scoreColor(scores.star!)} />
                        <StatCard label="Answers Recorded" value={String(scores.starLog.length)} sub="Total practice" />
                        <StatCard label="Competencies" value={String(Object.keys(byComp).length)} sub="Areas covered" />
                      </div>
                      <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <h3 className="text-sm font-semibold text-white mb-4">Score by Competency</h3>
                        <ModuleBars data={compData} horizontal />
                      </div>
                    </>
                  )
                })()}
                <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {scores.starLog.map((entry: STARScoreEntry, i: number) => (
                    <div key={i} className="flex items-center gap-4 p-4" style={{ borderBottom: i < scores.starLog!.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <Mic2 className="w-5 h-5" style={{ color: "rgba(255,255,255,0.4)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{entry.competency}</p>
                        <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.62)" }}>{entry.experienceText?.slice(0, 60)}… · {fmtDate(entry.date)}</p>
                      </div>
                      <ScoreBadge score={entry.score} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── PSYCHOMETRIC ── */}
        {activeTab === "psychometric" && (
          <div className="space-y-4">
            {(!scores.psychLog || scores.psychLog.length === 0) ? (
              <div className="rounded-2xl p-12 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <EmptyState icon={Brain} message="No psychometric tests yet — go to Psychometric Tests to start" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <StatCard label="Avg Score" value={`${scores.psychometric}/100`} sub={scoreBand(scores.psychometric!)} color={scoreColor(scores.psychometric!)} />
                  <StatCard label="Tests Taken" value={String(scores.psychLog.length)} sub="Total sessions" />
                  <StatCard label="Best Score" value={`${Math.max(...scores.psychLog.map((e: any) => e.score))}/100`} sub="All time high" color="#059669" />
                </div>
                <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {scores.psychLog.map((entry: any, i: number) => (
                    <div key={i} className="flex items-center gap-4 p-4" style={{ borderBottom: i < scores.psychLog!.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <Brain className="w-5 h-5" style={{ color: "rgba(255,255,255,0.4)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{entry.testName || "Psychometric Test"}</p>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.62)" }}>{fmtDate(entry.date)}</p>
                      </div>
                      <ScoreBadge score={entry.score} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

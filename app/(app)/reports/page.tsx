"use client"
import { useEffect, useState } from "react"
import { Topbar } from "@/components/layout/topbar"
import { ReadinessRadar } from "@/components/charts/readiness-radar"
import { ModuleBars } from "@/components/charts/module-bars"
import { loadDashboardScores, DashboardScores, VideoScoreEntry, CVScoreEntry, STARScoreEntry } from "@/lib/scores"
import { loadSessions } from "@/lib/interview/session-store"
import type { StoredSession } from "@/lib/interview/types"
import { cn } from "@/lib/utils"
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
function scoreBand(s: number) {
  if (s >= 75) return "Interview Ready"
  if (s >= 60) return "Strong Foundation"
  if (s >= 40) return "Developing"
  return "Needs Practice"
}
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
    <div className="text-center py-10 text-ink-faint">
      <Icon className="w-8 h-8 mx-auto mb-2 opacity-30" />
      <p className="text-sm">{message}</p>
      <p className="text-xs mt-1 opacity-70">Complete a session to see your data here</p>
    </div>
  )
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-surface-border p-5 text-center">
      <p className="text-2xl font-bold text-ink" style={color ? { color } : {}}>{value}</p>
      <p className="text-xs font-medium text-ink mt-1">{label}</p>
      <p className="text-xs text-ink-faint">{sub}</p>
    </div>
  )
}

// ── Video interview session card (expandable) ─────────────────────────────────
function VideoSessionCard({ session }: { session: StoredSession }) {
  const [expanded, setExpanded] = useState(false)
  const r = session.report
  if (!r) return null
  return (
    <div className="bg-white rounded-2xl border border-surface-border overflow-hidden">
      <button onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-4 p-4 hover:bg-surface-muted transition-colors text-left">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "#EEE9FF" }}>
          <Video className="w-5 h-5" style={{ color: "#6D5EF3" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink">{session.setup.sector} · {session.setup.mode}</p>
          <p className="text-xs text-ink-faint">{fmtDate(new Date(session.timestamp).toISOString())} · {session.setup.difficulty} · {session.answers.length} questions</p>
        </div>
        <div className="text-right flex-shrink-0 flex items-center gap-3">
          <div>
            <span className="text-xl font-bold" style={{ color: scoreColor(r.overallScore) }}>{r.overallScore}</span>
            <span className="text-xs text-ink-faint">/100</span>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-ink-faint" /> : <ChevronDown className="w-4 h-4 text-ink-faint" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-surface-border px-4 pb-4 pt-3 space-y-4">
          {/* Score breakdown */}
          <div className="grid grid-cols-5 gap-2">
            {[
              { label: "Content", score: r.contentScore },
              { label: "STAR", score: r.starScore },
              { label: "Delivery", score: r.deliveryScore },
              { label: "Commercial", score: r.commercialScore },
              { label: "Comms", score: r.communicationScore },
            ].map(({ label, score }) => (
              <div key={label} className="text-center p-2 rounded-xl bg-surface-muted border border-surface-border">
                <p className="text-xs text-ink-faint mb-0.5">{label}</p>
                <p className="text-sm font-bold" style={{ color: scoreColor(score) }}>{score}</p>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="flex gap-4 text-xs text-ink-muted">
            <span>⏱ {fmtTime(r.totalDurationSeconds || 0)}</span>
            <span>💬 {r.totalFillerWords} fillers</span>
            <span>🎯 {r.avgWordsPerMinute} wpm avg</span>
          </div>

          {/* Recruiter feedback */}
          {r.recruiterFeedback && (
            <div className="rounded-xl p-3 text-sm text-ink-muted leading-relaxed"
              style={{ backgroundColor: "rgba(238,233,255,0.5)", border: "1px solid rgba(109,94,243,0.1)" }}>
              {r.recruiterFeedback}
            </div>
          )}

          {/* Strengths / Improvements */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold text-ink mb-2">Strengths</p>
              <ul className="space-y-1">
                {(r.strengths || []).map((s: string, i: number) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-ink-muted">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-ink mb-2">Improvements</p>
              <ul className="space-y-1">
                {(r.improvements || []).map((s: string, i: number) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-ink-muted">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Per-answer breakdown */}
          {session.answers.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-ink mb-2">Answer Breakdown</p>
              <div className="space-y-1.5">
                {session.answers.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 bg-surface-muted rounded-xl border border-surface-border">
                    <span className="w-6 h-6 rounded-lg text-xs font-bold text-white flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: scoreColor(a.overallScore) }}>
                      {a.overallScore}
                    </span>
                    <p className="flex-1 text-xs text-ink truncate">{a.questionText}</p>
                    <span className="text-xs text-ink-faint flex-shrink-0">{a.fillerWords?.total || 0} fillers</span>
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
    setScores(loadDashboardScores())
    setInterviewSessions(loadSessions().filter(s => s.report !== null))
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

  const moduleData = [
    { name: "CV & ATS", score: scores.cv ?? 0 },
    { name: "STAR", score: scores.star ?? 0 },
    { name: "Video Interview", score: scores.video ?? 0 },
    { name: "Psychometric", score: scores.psychometric ?? 0 },
  ].filter(m => m.score > 0)

  const radarData = scores.radarData

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
        <div className="flex gap-1 bg-surface-muted rounded-2xl p-1 overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex-shrink-0",
                activeTab === tab.id ? "bg-white text-ink shadow-sm" : "text-ink-muted hover:text-ink")}>
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {totalSessions === 0 ? (
              <div className="bg-white rounded-2xl border border-surface-border p-12 text-center">
                <Activity className="w-12 h-12 mx-auto mb-3 text-ink-faint opacity-40" />
                <h3 className="text-base font-semibold text-ink mb-1">No data yet</h3>
                <p className="text-sm text-ink-muted">Complete a CV analysis, STAR practice, interview, or psychometric test to see your analytics here.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Radar */}
                  <div className="bg-white rounded-2xl border border-surface-border p-6">
                    <h3 className="text-sm font-semibold text-ink mb-4">Skill Coverage Radar</h3>
                    {radarData.some(d => d.score > 0)
                      ? <ReadinessRadar data={radarData} />
                      : <EmptyState icon={Target} message="Complete modules to build your radar" />
                    }
                  </div>

                  {/* Module bars */}
                  <div className="bg-white rounded-2xl border border-surface-border p-6">
                    <h3 className="text-sm font-semibold text-ink mb-4">Module Score Breakdown</h3>
                    {moduleData.length > 0
                      ? <ModuleBars data={moduleData} />
                      : <EmptyState icon={BarChart3} message="Complete modules to see scores" />
                    }
                  </div>
                </div>

                {/* Recent activity */}
                <div className="bg-white rounded-2xl border border-surface-border p-6">
                  <h3 className="text-sm font-semibold text-ink mb-4">Recent Activity</h3>
                  {scores.recentSessions.length === 0 ? (
                    <EmptyState icon={Calendar} message="No sessions recorded yet" />
                  ) : (
                    <div className="space-y-2">
                      {scores.recentSessions.map((s, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-surface-muted rounded-xl border border-surface-border">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: s.score >= 75 ? "#D1FAE5" : s.score >= 60 ? "#DBEAFE" : "#FEF3C7" }}>
                            <span className="text-xs font-bold" style={{ color: scoreColor(s.score) }}>{s.score}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-ink truncate">{s.label}</p>
                            <p className="text-xs text-ink-faint">{fmtDate(s.date)}</p>
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
                      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                        <p className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" /> Priority Focus
                        </p>
                        <p className="text-base font-bold text-ink">{scores.weakest.label}</p>
                        <p className="text-2xl font-bold text-amber-600 mt-1">{scores.weakest.score}/100</p>
                        <p className="text-xs text-amber-700 mt-1">Your biggest improvement opportunity</p>
                      </div>
                    )}
                    {scores.strongest && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
                        <p className="text-xs font-semibold text-emerald-700 mb-1 flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5" /> Biggest Strength
                        </p>
                        <p className="text-base font-bold text-ink">{scores.strongest.label}</p>
                        <p className="text-2xl font-bold text-emerald-600 mt-1">{scores.strongest.score}/100</p>
                        <p className="text-xs text-emerald-700 mt-1">Keep building on this</p>
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
              <div className="bg-white rounded-2xl border border-surface-border p-12 text-center">
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
              <div className="bg-white rounded-2xl border border-surface-border p-12 text-center">
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
                <div className="bg-white rounded-2xl border border-surface-border divide-y divide-surface-border">
                  {scores.cvLog.map((entry: CVScoreEntry, i: number) => (
                    <div key={i} className="flex items-center gap-4 p-4">
                      <div className="w-10 h-10 rounded-xl bg-surface-muted flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-ink-faint" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink">CV Analysis</p>
                        <p className="text-xs text-ink-faint truncate">{entry.jobSpec || "General analysis"} · {fmtDate(entry.date)}</p>
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
              <div className="bg-white rounded-2xl border border-surface-border p-12 text-center">
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
                      <div className="bg-white rounded-2xl border border-surface-border p-6">
                        <h3 className="text-sm font-semibold text-ink mb-4">Score by Competency</h3>
                        <ModuleBars data={compData} horizontal />
                      </div>
                    </>
                  )
                })()}
                <div className="bg-white rounded-2xl border border-surface-border divide-y divide-surface-border">
                  {scores.starLog.map((entry: STARScoreEntry, i: number) => (
                    <div key={i} className="flex items-center gap-4 p-4">
                      <div className="w-10 h-10 rounded-xl bg-surface-muted flex items-center justify-center flex-shrink-0">
                        <Mic2 className="w-5 h-5 text-ink-faint" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink">{entry.competency}</p>
                        <p className="text-xs text-ink-faint truncate">{entry.experienceText?.slice(0, 60)}… · {fmtDate(entry.date)}</p>
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
              <div className="bg-white rounded-2xl border border-surface-border p-12 text-center">
                <EmptyState icon={Brain} message="No psychometric tests yet — go to Psychometric Tests to start" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <StatCard label="Avg Score" value={`${scores.psychometric}/100`} sub={scoreBand(scores.psychometric!)} color={scoreColor(scores.psychometric!)} />
                  <StatCard label="Tests Taken" value={String(scores.psychLog.length)} sub="Total sessions" />
                  <StatCard label="Best Score" value={`${Math.max(...scores.psychLog.map((e: any) => e.score))}/100`} sub="All time high" color="#059669" />
                </div>
                <div className="bg-white rounded-2xl border border-surface-border divide-y divide-surface-border">
                  {scores.psychLog.map((entry: any, i: number) => (
                    <div key={i} className="flex items-center gap-4 p-4">
                      <div className="w-10 h-10 rounded-xl bg-surface-muted flex items-center justify-center flex-shrink-0">
                        <Brain className="w-5 h-5 text-ink-faint" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink">{entry.testName || "Psychometric Test"}</p>
                        <p className="text-xs text-ink-faint">{fmtDate(entry.date)}</p>
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

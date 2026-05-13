"use client"
import { useState, useEffect, useCallback } from "react"
import { Topbar } from "@/components/layout/topbar"
import { demoIndustryScores, sectorContent, sectors } from "@/lib/mock-data"
import { cn, getScoreColor, getScoreBg, getScoreLabel } from "@/lib/utils"
import {
  BookOpen, TrendingUp, Users, Briefcase, Code, Award,
  HelpCircle, ChevronDown, ChevronUp, ExternalLink, RefreshCw,
  Loader2, Newspaper, Zap, CheckCircle, Clock, Globe,
  Brain, MessageSquare, Star, AlertCircle, ChevronRight
} from "lucide-react"

interface NewsItem {
  id: string
  title: string
  snippet: string
  url: string
  source: string
  credibility: string
  publishedAt: string
  relevanceScore: number
}

const sectorColors: Record<string, string> = {
  Banking: "bg-blue-100 text-blue-700 border-blue-200",
  "Investment Banking": "bg-indigo-100 text-indigo-700 border-indigo-200",
  Consulting: "bg-purple-100 text-purple-700 border-purple-200",
  "Asset Management": "bg-teal-100 text-teal-700 border-teal-200",
  "Wealth Management": "bg-emerald-100 text-emerald-700 border-emerald-200",
  Insurance: "bg-amber-100 text-amber-700 border-amber-200",
  Technology: "bg-cyan-100 text-cyan-700 border-cyan-200",
  Law: "bg-red-100 text-red-700 border-red-200",
  Engineering: "bg-orange-100 text-orange-700 border-orange-200",
  FMCG: "bg-lime-100 text-lime-700 border-lime-200",
  Energy: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Healthcare: "bg-rose-100 text-rose-700 border-rose-200",
  "Public Sector": "bg-slate-100 text-slate-700 border-slate-200",
}

const sourceColors: Record<string, string> = {
  "BBC Business": "bg-red-50 text-red-700 border-red-200",
  "Financial Times": "bg-pink-50 text-pink-700 border-pink-200",
  "The Guardian": "bg-blue-50 text-blue-700 border-blue-200",
  "City A.M.": "bg-purple-50 text-purple-700 border-purple-200",
  "The Economist": "bg-red-50 text-red-700 border-red-100",
  "CNBC Business": "bg-cyan-50 text-cyan-700 border-cyan-200",
  "CNBC Finance": "bg-cyan-50 text-cyan-700 border-cyan-200",
  "MarketWatch": "bg-green-50 text-green-700 border-green-200",
  "TechCrunch": "bg-orange-50 text-orange-700 border-orange-200",
  "Wired": "bg-surface-muted text-ink border-surface-border",
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (h < 1) return "Just now"
  if (h < 24) return `${h}h ago`
  if (d < 7) return `${d}d ago`
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

type HubTab = "overview" | "news" | "interview-prep" | "certifications"

export default function IndustryHubPage() {
  const [activeSector, setActiveSector] = useState("Consulting")
  const [activeTab, setActiveTab] = useState<HubTab>("overview")
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null)
  const [expandedTrend, setExpandedTrend] = useState<number | null>(null)
  const [news, setNews] = useState<NewsItem[]>([])
  const [newsLoading, setNewsLoading] = useState(false)
  const [newsError, setNewsError] = useState("")
  const [newsFetched, setNewsFetched] = useState(false)
  const [aiInsight, setAiInsight] = useState<any>(null)
  const [insightLoading, setInsightLoading] = useState(false)
  const [sourceFilter, setSourceFilter] = useState<string>("all")

  const content = sectorContent[activeSector.toLowerCase().replace(/ /g, "")] ||
    sectorContent[activeSector.toLowerCase()] ||
    sectorContent.consulting

  const fetchNews = useCallback(async (sector: string, force = false) => {
    setNewsLoading(true)
    setNewsError("")
    try {
      const res = await fetch(`/api/news?sector=${encodeURIComponent(sector.toLowerCase())}${force ? "&refresh=1" : ""}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to fetch news")
      setNews(data.items || [])
      setNewsFetched(true)
    } catch (err: any) {
      setNewsError(err.message || "Could not load news. Please try again.")
    } finally {
      setNewsLoading(false)
    }
  }, [])

  const fetchAiInsight = async (sector: string, topic: string) => {
    setInsightLoading(true)
    setAiInsight(null)
    try {
      const res = await fetch("/api/ai/sector-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sector, topic }),
      })
      const data = await res.json()
      setAiInsight(data)
    } finally {
      setInsightLoading(false)
    }
  }

  // Auto-fetch news when switching to news tab
  useEffect(() => {
    if (activeTab === "news" && !newsFetched) {
      fetchNews(activeSector)
    }
  }, [activeTab, activeSector, newsFetched, fetchNews])

  const handleSectorChange = (sector: string) => {
    setActiveSector(sector)
    setNewsFetched(false)
    setNews([])
    setAiInsight(null)
    setExpandedQuestion(null)
    setExpandedTrend(null)
    setSourceFilter("all")
  }

  const sectorScore = demoIndustryScores.sectors.find(
    s => s.sector.toLowerCase() === activeSector.toLowerCase()
  )?.score || 50

  const allSources = ["all", ...Array.from(new Set(news.map(n => n.source)))]
  const filteredNews = sourceFilter === "all" ? news : news.filter(n => n.source === sourceFilter)

  const tabs: { id: HubTab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <BookOpen className="w-4 h-4" /> },
    { id: "news", label: "Live News", icon: <Newspaper className="w-4 h-4" /> },
    { id: "interview-prep", label: "Interview Prep", icon: <MessageSquare className="w-4 h-4" /> },
    { id: "certifications", label: "Certifications", icon: <Award className="w-4 h-4" /> },
  ]

  return (
    <div className="flex flex-col min-h-full">
      <Topbar title="Industry & Sector Hub" />
      <div className="flex-1 p-6 space-y-6">

        {/* Sector progress row */}
        <div className="flex gap-3 overflow-x-auto pb-1">
          {demoIndustryScores.sectors.map(s => (
            <button
              key={s.sector}
              onClick={() => handleSectorChange(s.sector)}
              className={cn(
                "flex-shrink-0 rounded-2xl border-2 p-4 text-left transition-all min-w-[140px]",
                activeSector === s.sector
                  ? "border-blue-500 bg-blue-50 shadow-sm shadow-blue-100"
                  : "border-surface-border bg-white hover:border-surface-border"
              )}
            >
              <p className="text-xs font-semibold text-ink-muted mb-1">{s.sector}</p>
              <p className={cn("text-2xl font-bold", getScoreColor(s.score))}>{s.score}</p>
              <div className="h-1 bg-surface-muted rounded-full mt-2 overflow-hidden">
                <div className={cn("h-full rounded-full", getScoreBg(s.score))} style={{ width: `${s.score}%` }} />
              </div>
              <p className={cn("text-xs mt-1", getScoreColor(s.score))}>{getScoreLabel(s.score)}</p>
            </button>
          ))}
        </div>

        {/* All sector chips */}
        <div className="flex flex-wrap gap-2">
          {sectors.map(s => (
            <button
              key={s}
              onClick={() => handleSectorChange(s)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium border transition-all",
                activeSector === s
                  ? sectorColors[s] || "bg-blue-100 text-blue-700 border-blue-200"
                  : "bg-white text-ink-muted border-surface-border hover:border-gray-300"
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Sector header */}
        <div className="rounded-3xl p-6 text-white" style={{ background: "linear-gradient(135deg, #6D5EF3 0%, #5B8DEF 100%)" }}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={cn("text-xs font-semibold px-3 py-1 rounded-full border",
                  sectorColors[activeSector] || "bg-blue-100 text-blue-700 border-blue-200"
                )}>
                  Sector Knowledge
                </span>
                <span className={cn("text-xs font-semibold", getScoreColor(sectorScore))}>
                  Your score: {sectorScore}/100
                </span>
              </div>
              <h2 className="text-2xl font-bold mb-2">{content?.name || activeSector}</h2>
              <p className="text-ink-faint text-sm leading-relaxed max-w-2xl">{content?.overview || `Explore sector-specific knowledge, trends, and interview preparation for ${activeSector}.`}</p>
            </div>
            <div className="flex-shrink-0 ml-6 text-right">
              <div className={cn("text-5xl font-bold", getScoreColor(sectorScore))}>{sectorScore}</div>
              <div className="text-ink-faint text-sm">/100</div>
              <button
                onClick={() => fetchAiInsight(activeSector, "current trends")}
                className="mt-3 flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                <Zap className="w-3 h-3" /> AI Insight
              </button>
            </div>
          </div>

          {/* AI insight panel */}
          {(insightLoading || aiInsight) && (
            <div className="mt-4 rounded-xl p-4" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}>
              {insightLoading ? (
                <div className="flex items-center gap-2 text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating AI insight for {activeSector}...
                </div>
              ) : aiInsight && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4" style={{ color: "#93C5FD" }} />
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#BFDBFE" }}>AI Sector Insight</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>Key Points</p>
                      {aiInsight.keyPoints?.slice(0, 3).map((p: string, i: number) => (
                        <p key={i} className="text-xs mb-1.5 flex items-start gap-1.5" style={{ color: "rgba(255,255,255,0.9)" }}>
                          <span className="mt-0.5 flex-shrink-0" style={{ color: "#93C5FD" }}>•</span> {p}
                        </p>
                      ))}
                    </div>
                    <div>
                      <p className="text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>Stats to Quote in Interviews</p>
                      {aiInsight.datPoints?.slice(0, 3).map((p: string, i: number) => (
                        <p key={i} className="text-xs mb-1.5 flex items-start gap-1.5" style={{ color: "rgba(255,255,255,0.9)" }}>
                          <span className="mt-0.5 flex-shrink-0" style={{ color: "#6EE7B7" }}>→</span> {p}
                        </p>
                      ))}
                    </div>
                  </div>
                  {aiInsight.watchOut && (
                    <div className="rounded-lg p-3" style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)" }}>
                      <p className="text-xs flex items-start gap-1.5" style={{ color: "#FDE68A" }}>
                        <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span><strong>Watch out:</strong> {aiInsight.watchOut}</span>
                      </p>
                    </div>
                  )}
                  {aiInsight.strongAnswer && (
                    <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: "#6EE7B7" }}>Model Interview Answer</p>
                      <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>{aiInsight.strongAnswer}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-muted rounded-xl p-1 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                activeTab === tab.id ? "bg-white text-ink shadow-sm" : "text-ink-muted hover:text-ink"
              )}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ─── OVERVIEW TAB ─────────────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Current Trends */}
              <div className="bg-white rounded-2xl border border-surface-border p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-ink">Current Trends & Themes</h3>
                </div>
                <div className="space-y-2">
                  {(content?.trends || ["Digital transformation", "ESG", "AI integration", "Regulatory change"]).map((trend: string, i: number) => (
                    <div key={i} className="rounded-xl border border-surface-border overflow-hidden">
                      <button
                        onClick={() => setExpandedTrend(expandedTrend === i ? null : i)}
                        className="w-full flex items-center justify-between p-3 hover:bg-surface-muted transition-colors text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                          <span className="text-sm text-gray-800 font-medium">{trend}</span>
                        </div>
                        {expandedTrend === i
                          ? <ChevronUp className="w-3 h-3 text-ink-faint flex-shrink-0" />
                          : <ChevronDown className="w-3 h-3 text-ink-faint flex-shrink-0" />
                        }
                      </button>
                      {expandedTrend === i && (
                        <div className="px-3 pb-3">
                          <button
                            onClick={() => fetchAiInsight(activeSector, trend)}
                            className="text-xs flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium"
                          >
                            <Zap className="w-3 h-3" /> Get AI explanation for interviews
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Client Segments */}
              <div className="bg-white rounded-2xl border border-surface-border p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-ink">Client Segments</h3>
                </div>
                <div className="space-y-2">
                  {(content?.clientSegments || ["Large corporates", "SMEs", "Institutional investors", "Government bodies"]).map((seg: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-surface-muted transition-colors">
                      <ChevronRight className="w-3 h-3 text-ink-faint flex-shrink-0" />
                      <span className="text-sm text-ink">{seg}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Graduate Roles */}
              <div className="bg-white rounded-2xl border border-surface-border p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-green-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-ink">Graduate Roles</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(content?.graduateRoles || ["Graduate Analyst", "Associate", "Trainee", "Junior Consultant"]).map((role: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-200">
                      {role}
                    </span>
                  ))}
                </div>
              </div>

              {/* Technical Areas */}
              <div className="bg-white rounded-2xl border border-surface-border p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Code className="w-4 h-4 text-orange-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-ink">Technical Knowledge Areas</h3>
                </div>
                <div className="space-y-1.5">
                  {(content?.technicalAreas || ["Financial analysis", "Data interpretation", "Report writing", "Stakeholder management"]).map((area: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-surface-muted transition-colors">
                      <CheckCircle className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                      <span className="text-sm text-ink">{area}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── LIVE NEWS TAB ────────────────────────────────────────────────────── */}
        {activeTab === "news" && (
          <div className="space-y-4">
            {/* Controls */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-sm font-semibold text-ink">Live News — {activeSector}</h3>
                <p className="text-xs text-ink-faint mt-0.5">
                  Sourced from BBC, Financial Times, Guardian, City A.M., CNBC, Economist · updated every 30 min
                </p>
              </div>
              <div className="flex items-center gap-2">
                {newsLoading ? (
                  <span className="flex items-center gap-1.5 text-xs text-blue-600">
                    <Loader2 className="w-3 h-3 animate-spin" /> Fetching latest...
                  </span>
                ) : (
                  <button
                    onClick={() => fetchNews(activeSector, true)}
                    className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-gray-800 bg-surface-muted hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </button>
                )}
              </div>
            </div>

            {/* Source filter chips */}
            {news.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {allSources.map(src => (
                  <button
                    key={src}
                    onClick={() => setSourceFilter(src)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                      sourceFilter === src
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-ink-muted border-surface-border hover:border-gray-300"
                    )}
                  >
                    {src === "all" ? `All (${news.length})` : src}
                  </button>
                ))}
              </div>
            )}

            {/* Error state */}
            {newsError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-sm text-red-800 font-medium">Could not load news</p>
                  <p className="text-xs text-red-600 mt-0.5">{newsError}</p>
                </div>
                <button onClick={() => fetchNews(activeSector, true)} className="ml-auto text-xs text-red-600 hover:text-red-700 underline">Retry</button>
              </div>
            )}

            {/* Loading state */}
            {newsLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-surface-border p-5 animate-pulse">
                    <div className="h-3 bg-surface-muted rounded w-1/4 mb-3" />
                    <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                    <div className="h-4 bg-surface-muted rounded w-3/4 mb-3" />
                    <div className="h-3 bg-surface-muted rounded w-1/2" />
                  </div>
                ))}
              </div>
            )}

            {/* No results */}
            {!newsLoading && newsFetched && filteredNews.length === 0 && (
              <div className="bg-white rounded-2xl border border-surface-border p-12 text-center">
                <Globe className="w-10 h-10 text-ink-faint mx-auto mb-3" />
                <p className="text-ink-muted font-medium">No news found for {activeSector}</p>
                <p className="text-sm text-ink-faint mt-1">Try refreshing or selecting a different sector</p>
                <button onClick={() => fetchNews(activeSector, true)} className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Try again
                </button>
              </div>
            )}

            {/* News grid */}
            {!newsLoading && filteredNews.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredNews.map((item, i) => (
                  <a
                    key={item.id || i}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-white rounded-2xl border border-surface-border p-5 hover:border-blue-200 hover:shadow-md transition-all flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className={cn(
                        "text-xs font-semibold px-2.5 py-1 rounded-full border",
                        sourceColors[item.source] || "bg-surface-muted text-ink-muted border-surface-border"
                      )}>
                        {item.source}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-ink-faint">
                        <Clock className="w-3 h-3" />
                        {timeAgo(item.publishedAt)}
                      </div>
                    </div>

                    <h4 className="text-sm font-semibold text-ink leading-snug mb-2 group-hover:text-blue-700 transition-colors line-clamp-3">
                      {item.title}
                    </h4>

                    {item.snippet && (
                      <p className="text-xs text-ink-muted leading-relaxed line-clamp-2 flex-1 mb-3">
                        {item.snippet}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
                      <div className="flex items-center gap-1.5">
                        {item.relevanceScore > 2 && (
                          <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                            <Star className="w-3 h-3" /> Highly Relevant
                          </span>
                        )}
                      </div>
                      <span className="flex items-center gap-1 text-xs text-blue-600 font-medium group-hover:underline">
                        Read full article <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            )}

            {/* Interview tip */}
            {!newsLoading && filteredNews.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Brain className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900">Interview Tip</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Pick 2-3 of these articles and prepare a 60-second summary. Interviewers in {activeSector} frequently ask "What have you read recently that affects this industry?" — having a specific, recent example with your own opinion will set you apart.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── INTERVIEW PREP TAB ───────────────────────────────────────────────── */}
        {activeTab === "interview-prep" && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Commercial awareness questions */}
              <div className="bg-white rounded-2xl border border-surface-border p-5">
                <div className="flex items-center gap-2 mb-4">
                  <HelpCircle className="w-5 h-5 text-blue-500" />
                  <h3 className="text-sm font-semibold text-ink">Commercial Awareness Questions</h3>
                </div>
                <div className="space-y-2">
                  {(content?.commercialPrompts || content?.interviewQuestions || [
                    "What is the biggest challenge facing this sector?",
                    "How is AI impacting this industry?",
                    "What differentiates the top firms in this space?",
                    "What recent news have you followed in this sector?"
                  ]).map((q: string, i: number) => (
                    <div key={i} className="rounded-xl border border-surface-border overflow-hidden">
                      <button
                        onClick={() => setExpandedQuestion(expandedQuestion === i ? null : i)}
                        className="w-full flex items-center gap-3 p-3.5 hover:bg-surface-muted transition-colors text-left"
                      >
                        <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0">Q</span>
                        <p className="text-sm text-gray-800 flex-1">{q}</p>
                        {expandedQuestion === i
                          ? <ChevronUp className="w-4 h-4 text-ink-faint flex-shrink-0" />
                          : <ChevronDown className="w-4 h-4 text-ink-faint flex-shrink-0" />
                        }
                      </button>
                      {expandedQuestion === i && (
                        <div className="px-4 pb-4">
                          <button
                            onClick={() => fetchAiInsight(activeSector, q)}
                            disabled={insightLoading}
                            className="flex items-center gap-1.5 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
                          >
                            {insightLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                            Generate AI model answer
                          </button>
                          {aiInsight?.strongAnswer && (
                            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                              <p className="text-xs font-semibold text-green-700 mb-1">Model Answer</p>
                              <p className="text-xs text-ink leading-relaxed">{aiInsight.strongAnswer}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical interview questions */}
              <div className="bg-white rounded-2xl border border-surface-border p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-5 h-5 text-purple-500" />
                  <h3 className="text-sm font-semibold text-ink">Technical Questions</h3>
                </div>
                <div className="space-y-2">
                  {(content?.interviewQuestions || [
                    "Walk me through a business case for this sector",
                    "What metrics would you use to measure performance?",
                    "How would you approach a client problem in this space?",
                    "What skills are most important for this role?",
                  ]).map((q: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl border border-surface-border hover:bg-surface-muted transition-colors">
                      <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">T</span>
                      <p className="text-sm text-ink">{q}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── CERTIFICATIONS TAB ───────────────────────────────────────────────── */}
        {activeTab === "certifications" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-surface-border p-6">
              <div className="flex items-center gap-2 mb-5">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-semibold text-ink">Recommended Certifications for {activeSector}</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {(content?.certifications || ["Relevant industry certifications", "Data analytics", "Project management", "Cloud platforms"]).map((cert: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-4 rounded-xl border-2 border-amber-100 bg-amber-50 hover:border-amber-200 transition-colors">
                    <div className="w-8 h-8 bg-amber-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Star className="w-4 h-4 text-amber-700" />
                    </div>
                    <span className="text-sm font-medium text-gray-800">{cert}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">Pro tip</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Even mentioning that you're <strong>studying for</strong> a certification shows commitment and commercial awareness.
                    The Bloomberg Market Concepts (BMC) certification is free for students and takes ~8 hours — mention it in any finance interview.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

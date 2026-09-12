"use client"
import { useState, useEffect, useCallback } from "react"
import { Topbar } from "@/components/layout/topbar"
import { sectorContent, sectors } from "@/lib/mock-data"
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

        {/* Sector selector.
            A per-sector "score" row used to sit above these chips, but the Hub has
            no assessment to score — those numbers were demo data presented as the
            reader's own progress, which is why the Dashboard (correctly) showed
            "Not started" while this page implied otherwise. The chips below already
            do the real job: choosing which sector briefing to read. */}
        <div className="flex flex-wrap gap-2">
          {sectors.map(s => (
            <button
              key={s}
              onClick={() => handleSectorChange(s)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
              style={activeSector === s
                ? { background: "rgba(91,140,255,0.15)", color: "#5B8CFF", border: "1px solid rgba(91,140,255,0.3)" }
                : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.08)" }
              }
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
                <span className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", color: "#ffffff" }}>
                  Sector Knowledge
                </span>
              </div>
              <h2 className="text-2xl font-bold mb-2">{content?.name || activeSector}</h2>
              <p className="text-sm leading-relaxed max-w-2xl" style={{ color: "rgba(255,255,255,0.75)" }}>{content?.overview || `Explore sector-specific knowledge, trends, and interview preparation for ${activeSector}.`}</p>
            </div>
            <div className="flex-shrink-0 ml-6 text-right">
              <button
                onClick={() => fetchAiInsight(activeSector, "current trends")}
                className="mt-3 flex items-center gap-1.5 text-xs text-white px-3 py-1.5 rounded-lg transition-colors hover:opacity-90"
                style={{ background: "rgba(255,255,255,0.2)" }}
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
        <div className="flex gap-1 rounded-xl p-1 w-fit" style={{ background: "rgba(255,255,255,0.04)" }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={activeTab === tab.id
                ? { background: "rgba(255,255,255,0.08)", color: "#ffffff" }
                : { color: "rgba(255,255,255,0.5)" }
              }
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
              <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(91,140,255,0.15)" }}>
                    <TrendingUp className="w-4 h-4" style={{ color: "#5B8CFF" }} />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Current Trends & Themes</h3>
                </div>
                <div className="space-y-2">
                  {(content?.trends || ["Digital transformation", "ESG", "AI integration", "Regulatory change"]).map((trend: string, i: number) => (
                    <div key={i} className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                      <button
                        onClick={() => setExpandedTrend(expandedTrend === i ? null : i)}
                        className="w-full flex items-center justify-between p-3 text-left transition-colors"
                        style={{ background: "transparent" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#5B8CFF" }} />
                          <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>{trend}</span>
                        </div>
                        {expandedTrend === i
                          ? <ChevronUp className="w-3 h-3 flex-shrink-0" style={{ color: "rgba(255,255,255,0.4)" }} />
                          : <ChevronDown className="w-3 h-3 flex-shrink-0" style={{ color: "rgba(255,255,255,0.4)" }} />
                        }
                      </button>
                      {expandedTrend === i && (
                        <div className="px-3 pb-3">
                          <button
                            onClick={() => fetchAiInsight(activeSector, trend)}
                            className="text-xs flex items-center gap-1.5 font-medium transition-opacity hover:opacity-70"
                            style={{ color: "#5B8CFF" }}
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
              <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(139,92,246,0.15)" }}>
                    <Users className="w-4 h-4" style={{ color: "#8B5CF6" }} />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Client Segments</h3>
                </div>
                <div className="space-y-2">
                  {(content?.clientSegments || ["Large corporates", "SMEs", "Institutional investors", "Government bodies"]).map((seg: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl transition-colors"
                      style={{ background: "transparent" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: "rgba(255,255,255,0.4)" }} />
                      <span className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>{seg}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Graduate Roles */}
              <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(52,211,153,0.15)" }}>
                    <Briefcase className="w-4 h-4" style={{ color: "#34D399" }} />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Graduate Roles</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(content?.graduateRoles || ["Graduate Analyst", "Associate", "Trainee", "Junior Consultant"]).map((role: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 rounded-full text-xs font-medium"
                      style={{ background: "rgba(52,211,153,0.12)", color: "#34D399", border: "1px solid rgba(52,211,153,0.25)" }}>
                      {role}
                    </span>
                  ))}
                </div>
              </div>

              {/* Technical Areas */}
              <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(251,191,36,0.12)" }}>
                    <Code className="w-4 h-4" style={{ color: "#FBBF24" }} />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Technical Knowledge Areas</h3>
                </div>
                <div className="space-y-1.5">
                  {(content?.technicalAreas || ["Financial analysis", "Data interpretation", "Report writing", "Stakeholder management"]).map((area: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl transition-colors"
                      style={{ background: "transparent" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#FBBF24" }} />
                      <span className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>{area}</span>
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
                <h3 className="text-sm font-semibold text-white">Live News — {activeSector}</h3>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.62)" }}>
                  {/* Name the outlets this sector actually returned. The list used to be
                      hardcoded to six titles and printed even when the feed was empty. */}
                  {news.length > 0
                    ? `Sourced from ${allSources.filter(s => s !== "all").join(", ")} · updated every 30 min`
                    : "Sourced from major UK and international business feeds · updated every 30 min"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {newsLoading ? (
                  <span className="flex items-center gap-1.5 text-xs" style={{ color: "#5B8CFF" }}>
                    <Loader2 className="w-3 h-3 animate-spin" /> Fetching latest...
                  </span>
                ) : (
                  <button
                    onClick={() => fetchNews(activeSector, true)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
                    style={{ color: "rgba(255,255,255,0.65)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
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
                    className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                    style={sourceFilter === src
                      ? { background: "rgba(91,140,255,0.15)", color: "#5B8CFF", border: "1px solid rgba(91,140,255,0.3)" }
                      : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.08)" }
                    }
                  >
                    {src === "all" ? `All (${news.length})` : src}
                  </button>
                ))}
              </div>
            )}

            {/* Error state */}
            {newsError && (
              <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
                <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: "#F87171" }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: "#F87171" }}>Could not load news</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(248,113,113,0.8)" }}>{newsError}</p>
                </div>
                <button onClick={() => fetchNews(activeSector, true)} className="ml-auto text-xs underline" style={{ color: "#F87171" }}>Retry</button>
              </div>
            )}

            {/* Loading state */}
            {newsLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-2xl p-5 animate-pulse" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="h-3 rounded w-1/4 mb-3" style={{ background: "rgba(255,255,255,0.08)" }} />
                    <div className="h-4 rounded w-full mb-2" style={{ background: "rgba(255,255,255,0.06)" }} />
                    <div className="h-4 rounded w-3/4 mb-3" style={{ background: "rgba(255,255,255,0.05)" }} />
                    <div className="h-3 rounded w-1/2" style={{ background: "rgba(255,255,255,0.05)" }} />
                  </div>
                ))}
              </div>
            )}

            {/* No results */}
            {!newsLoading && newsFetched && filteredNews.length === 0 && (
              <div className="rounded-2xl p-12 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <Globe className="w-10 h-10 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.2)" }} />
                <p className="font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>
                  {sourceFilter === "all" ? `No ${activeSector} stories in today's feeds` : `Nothing from ${sourceFilter} today`}
                </p>
                <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.62)" }}>
                  {sourceFilter === "all"
                    ? "Our sources publish general business news, so quieter sectors have thin days. Check back later or browse another sector."
                    : "Try selecting All to see every source."}
                </p>
                <button onClick={() => fetchNews(activeSector, true)} className="mt-4 text-sm font-medium" style={{ color: "#5B8CFF" }}>
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
                    className="group rounded-2xl p-5 flex flex-col transition-all"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = "rgba(91,140,255,0.3)"
                      e.currentTarget.style.background = "rgba(255,255,255,0.06)"
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"
                      e.currentTarget.style.background = "rgba(255,255,255,0.04)"
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        {item.source}
                      </span>
                      <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.62)" }}>
                        <Clock className="w-3 h-3" />
                        {timeAgo(item.publishedAt)}
                      </div>
                    </div>

                    <h4 className="text-sm font-semibold text-white leading-snug mb-2 line-clamp-3 group-hover:opacity-80 transition-opacity">
                      {item.title}
                    </h4>

                    {item.snippet && (
                      <p className="text-xs leading-relaxed line-clamp-2 flex-1 mb-3" style={{ color: "rgba(255,255,255,0.65)" }}>
                        {item.snippet}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex items-center gap-1.5">
                        {item.relevanceScore > 2 && (
                          <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "#34D399" }}>
                            <Star className="w-3 h-3" /> Highly Relevant
                          </span>
                        )}
                      </div>
                      <span className="flex items-center gap-1 text-xs font-medium group-hover:underline" style={{ color: "#5B8CFF" }}>
                        Read full article <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            )}

            {/* Interview tip */}
            {!newsLoading && filteredNews.length > 0 && (
              <div className="rounded-xl p-4" style={{ background: "rgba(91,140,255,0.08)", border: "1px solid rgba(91,140,255,0.2)" }}>
                <div className="flex items-start gap-3">
                  <Brain className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#5B8CFF" }} />
                  <div>
                    <p className="text-sm font-semibold text-white">Interview Tip</p>
                    <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>
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
              <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <HelpCircle className="w-5 h-5" style={{ color: "#5B8CFF" }} />
                  <h3 className="text-sm font-semibold text-white">Commercial Awareness Questions</h3>
                </div>
                <div className="space-y-2">
                  {(content?.commercialPrompts || content?.interviewQuestions || [
                    "What is the biggest challenge facing this sector?",
                    "How is AI impacting this industry?",
                    "What differentiates the top firms in this space?",
                    "What recent news have you followed in this sector?"
                  ]).map((q: string, i: number) => (
                    <div key={i} className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                      <button
                        onClick={() => setExpandedQuestion(expandedQuestion === i ? null : i)}
                        className="w-full flex items-center gap-3 p-3.5 text-left transition-colors"
                        style={{ background: "transparent" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0"
                          style={{ background: "rgba(91,140,255,0.15)", color: "#5B8CFF" }}>Q</span>
                        <p className="text-sm flex-1" style={{ color: "rgba(255,255,255,0.65)" }}>{q}</p>
                        {expandedQuestion === i
                          ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(255,255,255,0.4)" }} />
                          : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(255,255,255,0.4)" }} />
                        }
                      </button>
                      {expandedQuestion === i && (
                        <div className="px-4 pb-4">
                          <button
                            onClick={() => fetchAiInsight(activeSector, q)}
                            disabled={insightLoading}
                            className="flex items-center gap-1.5 text-xs text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                            style={{ background: "#5B8CFF" }}
                          >
                            {insightLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                            Generate AI model answer
                          </button>
                          {aiInsight?.strongAnswer && (
                            <div className="mt-3 p-3 rounded-xl" style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)" }}>
                              <p className="text-xs font-semibold mb-1" style={{ color: "#34D399" }}>Model Answer</p>
                              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{aiInsight.strongAnswer}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical interview questions */}
              <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-5 h-5" style={{ color: "#8B5CF6" }} />
                  <h3 className="text-sm font-semibold text-white">Technical Questions</h3>
                </div>
                <div className="space-y-2">
                  {(content?.interviewQuestions || [
                    "Walk me through a business case for this sector",
                    "What metrics would you use to measure performance?",
                    "How would you approach a client problem in this space?",
                    "What skills are most important for this role?",
                  ]).map((q: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl transition-colors"
                      style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: "rgba(139,92,246,0.15)", color: "#A78BFA" }}>T</span>
                      <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>{q}</p>
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
            <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2 mb-5">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Recommended Certifications for {activeSector}</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {(content?.certifications || ["Relevant industry certifications", "Data analytics", "Project management", "Cloud platforms"]).map((cert: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-4 rounded-xl transition-colors"
                    style={{ border: "2px solid rgba(251,191,36,0.2)", background: "rgba(251,191,36,0.06)" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(251,191,36,0.35)")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(251,191,36,0.2)")}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(251,191,36,0.2)" }}>
                      <Star className="w-4 h-4" style={{ color: "#FBBF24" }} />
                    </div>
                    <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>{cert}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl p-4" style={{ background: "rgba(91,140,255,0.08)", border: "1px solid rgba(91,140,255,0.2)" }}>
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#5B8CFF" }} />
                <div>
                  <p className="text-sm font-semibold text-white">Pro tip</p>
                  <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>
                    Even mentioning that you're <strong style={{ color: "rgba(255,255,255,0.85)" }}>studying for</strong> a certification shows commitment and commercial awareness.
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

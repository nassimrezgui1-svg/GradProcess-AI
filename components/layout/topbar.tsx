"use client"
import { useEffect, useState } from "react"
import { Sparkles } from "lucide-react"
import { loadProfile, getInitials } from "@/lib/profile"
import { loadDashboardScores } from "@/lib/scores"
import { cn } from "@/lib/utils"

function scoreColor(score: number) {
  if (score >= 75) return "#22D3EE"
  if (score >= 60) return "#5B8CFF"
  if (score >= 40) return "#FBBF24"
  return "#F87171"
}

export function Topbar({ title }: { title: string }) {
  const [name, setName] = useState("")
  const [initials, setInitials] = useState("?")
  const [overallScore, setOverallScore] = useState<number | null>(null)

  useEffect(() => {
    const profile = loadProfile()
    setName(profile.name)
    setInitials(getInitials(profile.name))
    const scores = loadDashboardScores()
    setOverallScore(scores.overall)
  }, [])

  const openAva = () => window.dispatchEvent(new CustomEvent("open-ava"))

  return (
    <header
      className="h-14 flex items-center justify-between px-6 flex-shrink-0"
      style={{
        background: "rgba(7,11,20,0.75)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Page title */}
      <h1 className="text-sm font-semibold truncate" style={{ color: "#E2E8F0" }}>{title}</h1>

      <div className="flex items-center gap-2">

        {/* Readiness pill */}
        {overallScore !== null && (
          <div
            className="hidden sm:flex items-center gap-2 rounded-full px-3 py-1.5"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <span className="text-xs" style={{ color: "#475569" }}>Readiness</span>
            <span className="font-bold text-xs tabular-nums" style={{ color: scoreColor(overallScore) }}>
              {overallScore}
            </span>
            <span className="text-[10px]" style={{ color: "#334155" }}>/100</span>
            {/* Tiny glow dot */}
            <span className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: scoreColor(overallScore), boxShadow: `0 0 6px ${scoreColor(overallScore)}` }} />
          </div>
        )}

        {/* Ask Ava */}
        <button
          onClick={openAva}
          className="flex items-center gap-2 btn-gradient text-xs font-semibold px-3.5 py-2 rounded-full"
          aria-label="Open Ava AI coach"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:block">Ask Ava</span>
        </button>

        {/* User avatar */}
        <div
          className="flex items-center gap-2 cursor-pointer rounded-full px-2 py-1 transition-all"
          style={{ color: "#94A3B8" }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #5B8CFF, #8B5CF6)",
              boxShadow: "0 0 12px rgba(91,140,255,0.30)",
            }}
          >
            {initials}
          </div>
          {name && (
            <span className="text-sm font-medium hidden md:block" style={{ color: "#94A3B8" }}>{name}</span>
          )}
        </div>
      </div>
    </header>
  )
}

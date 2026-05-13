"use client"
import { useEffect, useState } from "react"
import { Sparkles } from "lucide-react"
import { LogoMark } from "@/components/brand/logo"
import { loadProfile, getInitials } from "@/lib/profile"
import { loadDashboardScores } from "@/lib/scores"
import { getScoreColor } from "@/lib/utils"
import { cn } from "@/lib/utils"

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

  const openAva = () => {
    // Trigger the floating Ava button click via custom event
    window.dispatchEvent(new CustomEvent("open-ava"))
  }

  return (
    <header className="h-14 bg-white border-b border-surface-border flex items-center justify-between px-6 flex-shrink-0">
      <h1 className="text-base font-semibold text-ink">{title}</h1>

      <div className="flex items-center gap-2.5">
        {/* Readiness pill */}
        {overallScore !== null && (
          <div className="hidden sm:flex items-center gap-1.5 bg-surface-muted border border-surface-border rounded-full px-3 py-1.5">
            <span className="text-ink-faint text-xs">Readiness</span>
            <span className={cn("font-bold text-xs", getScoreColor(overallScore))}>{overallScore}/100</span>
          </div>
        )}

        {/* Ava button — always visible */}
        <button
          onClick={openAva}
          className="flex items-center gap-2 bg-gradient-to-r from-brand-purple to-brand-blue text-white text-xs font-semibold px-3.5 py-2 rounded-full hover:opacity-90 active:scale-95 transition-all shadow-purple"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:block">Ask Ava</span>
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-2 cursor-pointer hover:bg-surface-muted rounded-full px-2 py-1 transition-colors">
          <div className="w-7 h-7 bg-gradient-to-br from-brand-purple to-brand-blue rounded-full flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>
          {name && <span className="text-sm font-medium text-ink hidden md:block">{name}</span>}
        </div>

        {/* GradProcess AI logo */}
        <div className="flex items-center gap-2 bg-surface-muted border border-surface-border rounded-full pl-1.5 pr-3 py-1">
          <LogoMark size={26} />
          <span className="text-xs font-bold text-ink hidden sm:block">
            GradProcess<span className="text-brand-purple"> AI</span>
          </span>
        </div>
      </div>
    </header>
  )
}

"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { loadGamification, GamificationState, getLevelInfo, getLevelProgress } from "@/lib/gamification"
import {
  LayoutDashboard, FileText, Mic2, Video, Brain,
  BookOpen, ClipboardList, BarChart3, Settings,
  Command, Flame, Zap, ChevronRight, Target,
} from "lucide-react"
import { motion } from "framer-motion"
import { LogoFull } from "@/components/brand/logo"

const navItems = [
  { href: "/dashboard",        label: "Dashboard",           icon: LayoutDashboard, color: "text-brand-purple" },
  { href: "/tracker",          label: "Application Tracker", icon: Target,          color: "text-emerald-500" },
  { href: "/cv-tailoring",     label: "CV Tailoring",        icon: FileText,        color: "text-brand-blue" },
  { href: "/star-builder", label: "STAR Builder", icon: Mic2, color: "text-amber-500" },
  { href: "/video-interview", label: "Video Interview", icon: Video, color: "text-rose-400" },
  { href: "/psychometric", label: "Psychometric Tests", icon: Brain, color: "text-purple-500" },
  { href: "/industry-hub", label: "Industry Hub", icon: BookOpen, color: "text-teal-500" },
  { href: "/full-process-exam", label: "Full Process Exam", icon: ClipboardList, color: "text-orange-400" },
  { href: "/reports", label: "Reports", icon: BarChart3, color: "text-blue-400" },
  { href: "/settings", label: "Settings", icon: Settings, color: "text-gray-400" },
]

export function Sidebar() {
  const pathname = usePathname()
  const [gam, setGam] = useState<GamificationState | null>(null)

  useEffect(() => {
    setGam(loadGamification())
  }, [])

  const progress = gam ? getLevelProgress(gam.xp) : 0
  const levelInfo = gam ? getLevelInfo(gam.xp) : null

  return (
    <aside className="w-60 bg-white min-h-screen flex flex-col border-r border-surface-border flex-shrink-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-surface-border">
        <Link href="/dashboard">
          <LogoFull iconSize={32} />
        </Link>
      </div>

      {/* Quick search */}
      <div className="px-3 pt-3 pb-1">
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }))}
          className="w-full flex items-center gap-2 bg-surface-muted hover:bg-surface-border/60 border border-surface-border rounded-xl px-3 py-2 text-xs text-ink-faint hover:text-ink-muted transition-all"
        >
          <Command className="w-3 h-3" />
          <span className="flex-1 text-left">Quick actions</span>
          <kbd className="text-ink-faint font-mono text-xs">⌘K</kbd>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, color }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                isActive
                  ? "nav-active font-semibold"
                  : "text-ink-muted hover:text-ink hover:bg-surface-muted"
              )}
            >
              <Icon className={cn("w-4 h-4 flex-shrink-0 transition-colors", isActive ? color : "text-ink-faint group-hover:" + color.replace("text-", "text-"))} />
              <span>{label}</span>
              {isActive && <ChevronRight className="w-3 h-3 ml-auto text-brand-purple/50" />}
            </Link>
          )
        })}
      </nav>

      {/* Gamification + Upgrade */}
      <div className="px-3 pb-4 space-y-3 border-t border-surface-border pt-3">
        {gam && gam.xp > 0 && (
          <div className="bg-surface-muted rounded-2xl p-3 space-y-2">
            {/* Level + streak */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-ink">{levelInfo?.name}</p>
                <p className="text-xs text-ink-faint">Level {gam.level}</p>
              </div>
              {gam.streakDays > 0 && (
                <div className="flex items-center gap-1 bg-orange-50 border border-orange-100 rounded-lg px-2 py-1">
                  <Flame className="w-3 h-3 text-orange-400" />
                  <span className="text-xs font-bold text-orange-500">{gam.streakDays}d</span>
                </div>
              )}
            </div>
            {/* XP bar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-ink-faint flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 text-amber-400" />{gam.xp} XP
                </span>
                <span className="text-xs text-ink-faint">{levelInfo?.nextXP} XP</span>
              </div>
              <div className="h-1.5 bg-surface-border rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-brand-purple to-brand-blue rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Upgrade card */}
        <div className="bg-gradient-to-br from-brand-purple-light to-brand-blue-light border border-brand-purple/15 rounded-2xl p-3.5">
          <p className="text-xs font-bold text-ink mb-0.5">Upgrade to Pro</p>
          <p className="text-xs text-ink-muted leading-relaxed mb-2.5">Unlock AI video scoring and full process simulations</p>
          <button className="w-full py-2 text-xs font-bold text-white bg-gradient-to-r from-brand-purple to-brand-blue rounded-xl hover:opacity-90 transition-opacity shadow-purple">
            Upgrade — £19/mo
          </button>
        </div>
      </div>
    </aside>
  )
}

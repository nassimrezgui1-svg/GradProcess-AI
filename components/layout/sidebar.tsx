"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { loadGamification, GamificationState, getLevelInfo, getLevelProgress } from "@/lib/gamification"
import {
  LayoutDashboard, FileText, Mic2, Video, Brain,
  BookOpen, BarChart3, Settings, CreditCard,
  Command, Flame, Zap, Target,
} from "lucide-react"
import { motion } from "framer-motion"
import { LogoFull } from "@/components/brand/logo"

const navItems = [
  { href: "/dashboard",         label: "Dashboard",           icon: LayoutDashboard, color: "#5B8CFF" },
  { href: "/tracker",           label: "Application Tracker", icon: Target,          color: "#10B981" },
  { href: "/cv-tailoring",      label: "CV Tailoring",        icon: FileText,        color: "#38BDF8" },
  { href: "/star-builder",      label: "STAR Builder",        icon: Mic2,            color: "#FBBF24" },
  { href: "/video-interview",   label: "Video Interview",     icon: Video,           color: "#F472B6" },
  { href: "/psychometric",      label: "Psychometric Tests",  icon: Brain,           color: "#A78BFA" },
  { href: "/industry-hub",      label: "Industry Hub",        icon: BookOpen,        color: "#34D399" },
  { href: "/reports",           label: "Reports",             icon: BarChart3,       color: "#5B8CFF" },
  { href: "/billing",            label: "Billing",             icon: CreditCard,      color: "#34D399" },
  { href: "/settings",          label: "Settings",            icon: Settings,        color: "#94A3B8" },
]

export function Sidebar() {
  const pathname = usePathname()
  const [gam, setGam] = useState<GamificationState | null>(null)

  useEffect(() => { setGam(loadGamification()) }, [])

  const progress  = gam ? getLevelProgress(gam.xp) : 0
  const levelInfo = gam ? getLevelInfo(gam.xp) : null

  return (
    <aside
      className="w-60 min-h-screen flex flex-col flex-shrink-0 relative z-20"
      style={{
        background: "rgba(7,11,20,0.88)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Logo */}
      <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Link href="/dashboard">
          <LogoFull iconSize={30} dark />
        </Link>
      </div>

      {/* Quick search */}
      <div className="px-3 pt-3 pb-1">
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }))}
          className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs transition-all"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            color: "#475569",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(91,140,255,0.06)"
            e.currentTarget.style.borderColor = "rgba(91,140,255,0.18)"
            e.currentTarget.style.color = "#64748B"
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "rgba(255,255,255,0.04)"
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"
            e.currentTarget.style.color = "#475569"
          }}
        >
          <Command className="w-3 h-3 flex-shrink-0" />
          <span className="flex-1 text-left">Quick actions</span>
          <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded"
            style={{ background: "rgba(255,255,255,0.05)", color: "#334155" }}>⌘K</kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, color }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border group relative",
                isActive ? "nav-active" : "border-transparent"
              )}
              style={!isActive ? { color: "#475569" } : undefined}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)"
                  e.currentTarget.style.color = "#94A3B8"
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent"
                  e.currentTarget.style.color = "#475569"
                }
              }}
            >
              <Icon
                className="w-4 h-4 flex-shrink-0 transition-colors duration-200"
                style={{ color: isActive ? color : undefined }}
              />
              <span className="truncate">{label}</span>
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-dot"
                  className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: color, boxShadow: `0 0 6px ${color}` }}
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-3 space-y-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>

        {/* XP / Level */}
        {gam && gam.xp > 0 && (
          <div className="rounded-2xl p-3 space-y-2.5"
            style={{
              background: "rgba(11,16,32,0.7)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold" style={{ color: "#E2E8F0" }}>{levelInfo?.name}</p>
                <p className="text-xs" style={{ color: "#475569" }}>Level {gam.level}</p>
              </div>
              {gam.streakDays > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg"
                  style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)" }}>
                  <Flame className="w-3 h-3" style={{ color: "#FBBF24" }} />
                  <span className="text-xs font-bold" style={{ color: "#FBBF24" }}>{gam.streakDays}d</span>
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] flex items-center gap-1" style={{ color: "#475569" }}>
                  <Zap className="w-2.5 h-2.5" style={{ color: "#FBBF24" }} />
                  {gam.xp} XP
                </span>
                <span className="text-[10px]" style={{ color: "#334155" }}>{levelInfo?.nextXP} XP</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #5B8CFF, #8B5CF6)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Upgrade card */}
        <div className="relative overflow-hidden rounded-2xl p-4"
          style={{
            background: "linear-gradient(135deg, rgba(91,140,255,0.12), rgba(139,92,246,0.10))",
            border: "1px solid rgba(91,140,255,0.20)",
          }}>
          <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl pointer-events-none"
            style={{ background: "rgba(91,140,255,0.15)" }} />
          <p className="text-xs font-bold text-white mb-0.5 relative">Upgrade to Pro</p>
          <p className="text-xs leading-relaxed mb-3 relative" style={{ color: "#64748B" }}>
            Unlock AI video scoring and full process reports
          </p>
          <button className="w-full py-2 text-xs font-bold text-white rounded-xl btn-gradient relative">
            Upgrade — £19.99/mo
          </button>
        </div>
      </div>
    </aside>
  )
}

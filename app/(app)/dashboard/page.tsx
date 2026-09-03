"use client"
import { useEffect, useState } from "react"
import { DATA_SYNCED_EVENT } from "@/lib/db/local"
import { motion } from "framer-motion"
import { Topbar } from "@/components/layout/topbar"
import { ReadinessRadar } from "@/components/charts/readiness-radar"
import { loadDashboardScores, DashboardScores } from "@/lib/scores"
import { loadProfile } from "@/lib/profile"
import {
  loadGamification, GamificationState, getTodaysChallenges,
  getCompanyReadiness, getLevelInfo, getLevelProgress
} from "@/lib/gamification"
import { cn, getScoreBand } from "@/lib/utils"
import {
  FileText, Mic2, Video, Brain, BookOpen,
  ArrowRight, Flame, Zap, ChevronRight, Sparkles,
  TrendingUp, CheckCircle2, Circle, Clock, BarChart3,
  Trophy, Target, Activity,
} from "lucide-react"
import Link from "next/link"

// ─── Animated Score Ring ──────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const [count, setCount] = useState(0)
  const size = 180
  const sw = 11
  const r = (size - sw * 2) / 2
  const circ = 2 * Math.PI * r

  useEffect(() => {
    let frame: number
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / 1400, 1)
      setCount(Math.round((1 - Math.pow(1 - p, 3)) * score))
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [score])

  const band = getScoreBand(score)
  const isHigh = score >= 75
  const gradStart = isHigh ? "#22D3EE" : score >= 60 ? "#5B8CFF" : "#FBBF24"
  const gradEnd   = isHigh ? "#5B8CFF" : score >= 60 ? "#8B5CF6" : "#F97316"
  const glowColor = isHigh ? "rgba(34,211,238,0.25)" : "rgba(91,140,255,0.25)"

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Outer ambient glow */}
      <div className="absolute inset-0 rounded-full blur-3xl scale-75 opacity-60 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${glowColor}, transparent 70%)` }} />
      <svg width={size} height={size} className="-rotate-90"
        style={{ filter: `drop-shadow(0 0 10px ${glowColor})` }}>
        <defs>
          <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradStart} />
            <stop offset="100%" stopColor={gradEnd} />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="rgba(255,255,255,0.05)" strokeWidth={sw} />
        <motion.circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke="url(#sg)" strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (score / 100) * circ }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center select-none">
        <span className="text-[42px] font-black text-white tabular-nums leading-none tracking-tight">{count}</span>
        <span className="text-[11px] text-white/30 font-semibold mt-0.5 tracking-widest uppercase">/ 100</span>
        <span className="text-xs font-bold mt-1.5 px-2.5 py-0.5 rounded-full"
          style={{ background: `${gradStart}18`, color: gradStart, border: `1px solid ${gradStart}30` }}>
          {band.label}
        </span>
      </div>
    </div>
  )
}

// ─── Module card (manages own hover state for per-colour glow) ────────────────

type ModuleDef = {
  href: string; label: string; description: string; icon: React.ElementType
  color: string; glow: string; xp: number
}

function ModuleCard({ mod, score, delay }: { mod: ModuleDef; score: number | null; delay: number }) {
  const [hovered, setHovered] = useState(false)
  const Icon = mod.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Link href={mod.href} className="block h-full">
        <div
          className="relative h-full rounded-2xl p-5 border transition-all duration-300 overflow-hidden cursor-pointer flex flex-col gap-4"
          style={{
            background: hovered ? "rgba(12,20,40,0.95)" : "rgba(8,14,30,0.7)",
            borderColor: hovered ? mod.color + "40" : "rgba(255,255,255,0.06)",
            boxShadow: hovered ? `0 0 40px ${mod.glow}, inset 0 0 40px ${mod.glow}` : "none",
            transform: hovered ? "translateY(-3px)" : "translateY(0)",
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* Corner glow on hover */}
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-2xl pointer-events-none transition-opacity duration-300"
            style={{ background: mod.glow, opacity: hovered ? 0.8 : 0 }} />

          {/* Icon + XP */}
          <div className="flex items-start justify-between relative">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300"
              style={{
                background: hovered ? mod.color + "20" : "rgba(255,255,255,0.05)",
                border: `1px solid ${hovered ? mod.color + "35" : "rgba(255,255,255,0.08)"}`,
              }}>
              <Icon className="w-5 h-5 transition-colors duration-300" style={{ color: hovered ? mod.color : "rgba(255,255,255,0.4)" }} />
            </div>
            <span className="text-[10px] font-bold rounded-lg px-2 py-1 flex items-center gap-1"
              style={{ background: "rgba(252,211,77,0.08)", color: "#FCD34D", border: "1px solid rgba(252,211,77,0.15)" }}>
              <Zap className="w-2.5 h-2.5" />+{mod.xp} XP
            </span>
          </div>

          {/* Text */}
          <div className="flex-1 relative">
            <h4 className="text-sm font-bold text-white mb-1.5">{mod.label}</h4>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.3)" }}>{mod.description}</p>
          </div>

          {/* Score / CTA */}
          <div className="relative">
            {score !== null ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.2)" }}>Score</span>
                  <span className="text-sm font-black tabular-nums" style={{ color: mod.color }}>{score}/100</span>
                </div>
                <div className="h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <motion.div className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${mod.color}80, ${mod.color})` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 0.9, delay: delay + 0.3 }}
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between text-xs font-semibold"
                style={{ color: hovered ? mod.color : "rgba(255,255,255,0.2)" }}>
                <span>Not started</span>
                <span className="flex items-center gap-1 transition-all duration-200">
                  Begin <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

// ─── Module definitions ───────────────────────────────────────────────────────

const MODULES: ModuleDef[] = [
  { href: "/cv-tailoring",      label: "CV & ATS",           description: "Optimise your CV for applicant tracking systems",  icon: FileText,    color: "#38BDF8", glow: "rgba(56,189,248,0.12)",   xp: 50  },
  { href: "/star-builder",      label: "STAR Builder",        description: "Craft compelling competency interview answers",     icon: Mic2,        color: "#FBBF24", glow: "rgba(251,191,36,0.12)",   xp: 30  },
  { href: "/video-interview",   label: "Video Interview",     description: "AI recruiter practice with live performance score", icon: Video,       color: "#F472B6", glow: "rgba(244,114,182,0.12)",  xp: 60  },
  { href: "/psychometric",      label: "Psychometric Tests",  description: "Sharpen numerical, verbal & logical reasoning",    icon: Brain,       color: "#A78BFA", glow: "rgba(167,139,250,0.12)",  xp: 40  },
  { href: "/industry-hub",      label: "Industry Hub",        description: "Live sector insights and market intelligence",      icon: BookOpen,    color: "#34D399", glow: "rgba(52,211,153,0.12)",   xp: 20  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 2) return "Just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [scores, setScores] = useState<DashboardScores | null>(null)
  const [gam, setGam] = useState<GamificationState | null>(null)
  const [profile, setProfile] = useState({ name: "" })

  useEffect(() => {
    const refresh = () => {
      setScores(loadDashboardScores())
      setGam(loadGamification())
      setProfile(loadProfile())
    }
    refresh()
    window.addEventListener(DATA_SYNCED_EVENT, refresh)
    return () => window.removeEventListener(DATA_SYNCED_EVENT, refresh)
  }, [])

  if (!scores || !gam) {
    return (
      <div className="flex flex-col min-h-full">
        <Topbar title="Dashboard" />
        <div className="flex-1 p-6 space-y-4 max-w-7xl mx-auto w-full">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.03)" }} />
          ))}
        </div>
      </div>
    )
  }

  const overall = scores.overall ?? 0
  const hasData = scores.overall !== null
  const band = getScoreBand(overall)
  const challenges = getTodaysChallenges(gam)
  const levelInfo = getLevelInfo(gam.xp)
  const lvlProgress = getLevelProgress(gam.xp)
  const companies = getCompanyReadiness(overall).slice(0, 5)

  const moduleScores: Record<string, number | null> = {
    "/cv-tailoring":      scores.cv,
    "/star-builder":      scores.star,
    "/video-interview":   scores.video,
    "/psychometric":      scores.psychometric,
    "/industry-hub":      null,
  }

  const firstName = profile.name ? profile.name.split(" ")[0] : null
  const completedModules = [scores.cv, scores.star, scores.video, scores.psychometric].filter(s => s !== null).length
  const daysToReady = hasData && overall < 85 ? Math.max(5, Math.round((85 - overall) * 0.9)) : null

  const motivationalLine = !hasData
    ? "Start with any module below to begin building your readiness score."
    : overall >= 85 ? "You're application-ready. Keep the edge sharp and stay ahead."
    : overall >= 70 ? `Just ${85 - overall} points from Application Ready — you're almost there.`
    : `${completedModules}/4 core modules complete. Every session compounds your advantage.`

  const chipStyle = (bg: string, color: string, border: string) => ({
    background: bg, color, border: `1px solid ${border}`,
  })

  return (
    <div className="flex flex-col min-h-full relative">

      <Topbar title="Dashboard" />

      <div className="relative z-10 flex-1 p-5 lg:p-6 max-w-7xl mx-auto w-full space-y-5">

        {/* ══ HERO CARD ══ */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl border"
          style={{
            background: "linear-gradient(135deg, #0A1225 0%, #080E1F 50%, #0C1230 100%)",
            borderColor: "rgba(255,255,255,0.07)",
          }}
        >
          {/* Hero internal glows */}
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(91,140,255,0.15), transparent 70%)" }} />
          <div className="absolute -bottom-20 -left-10 w-60 h-60 rounded-full blur-3xl pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(139,92,246,0.1), transparent 70%)" }} />
          {/* Dot grid overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{
              backgroundImage: "radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }} />

          <div className="relative flex flex-col lg:flex-row items-start lg:items-center gap-8 p-7 sm:p-9">

            {/* ── Left column ── */}
            <div className="flex-1 space-y-6">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.2em] uppercase mb-2"
                  style={{ color: "rgba(91,140,255,0.7)" }}>
                  {getGreeting()}{firstName ? `, ${firstName}` : ""}
                </p>
                <h2 className="text-2xl sm:text-3xl font-black text-white leading-[1.15] mb-3">
                  Your Readiness{" "}
                  <span style={{
                    background: "linear-gradient(90deg, #5B8CFF, #22D3EE)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}>
                    Command Centre
                  </span>
                </h2>
                <p className="text-sm leading-relaxed max-w-md" style={{ color: "rgba(255,255,255,0.38)" }}>
                  {motivationalLine}
                </p>
              </div>

              {/* Achievement chips */}
              <div className="flex flex-wrap gap-2">
                {gam.streakDays > 0 && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold rounded-xl px-3 py-2"
                    style={chipStyle("rgba(251,146,60,0.1)", "#FB923C", "rgba(251,146,60,0.25)")}>
                    <Flame className="w-3.5 h-3.5" />{gam.streakDays}-day streak
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-xs font-semibold rounded-xl px-3 py-2"
                  style={chipStyle("rgba(252,211,77,0.08)", "#FCD34D", "rgba(252,211,77,0.2)")}>
                  <Zap className="w-3.5 h-3.5" />{gam.xp} XP · {levelInfo.name}
                </span>
                {hasData && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold rounded-xl px-3 py-2"
                    style={chipStyle("rgba(91,140,255,0.1)", "#5B8CFF", "rgba(91,140,255,0.25)")}>
                    <TrendingUp className="w-3.5 h-3.5" />{completedModules}/4 modules
                  </span>
                )}
                {daysToReady && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold rounded-xl px-3 py-2"
                    style={chipStyle("rgba(34,211,238,0.07)", "#22D3EE", "rgba(34,211,238,0.18)")}>
                    <Clock className="w-3.5 h-3.5" />~{daysToReady} days to ready
                  </span>
                )}
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/cv-tailoring"
                  className="flex items-center gap-2 text-sm font-bold text-white rounded-xl px-5 py-2.5 transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg, #5B8CFF 0%, #8B5CF6 100%)", boxShadow: "0 4px 24px rgba(91,140,255,0.4)" }}>
                  <Target className="w-4 h-4" />
                  Analyse my CV
                </Link>
                <Link href="/reports"
                  className="flex items-center gap-2 text-sm font-semibold rounded-xl px-4 py-2.5 transition-all hover:border-white/20"
                  style={{ color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.09)" }}>
                  <BarChart3 className="w-4 h-4" />
                  View Reports
                </Link>
              </div>
            </div>

            {/* ── Score ring ── */}
            <div className="flex flex-col items-center gap-2 lg:pr-4 flex-shrink-0">
              <ScoreRing score={overall} />
              <p className="text-[10px] font-semibold tracking-[0.18em] uppercase mt-1"
                style={{ color: "rgba(255,255,255,0.2)" }}>
                Overall Readiness
              </p>
            </div>
          </div>
        </motion.div>

        {/* ══ MODULE GRID ══ */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.7)" }}>Training Modules</h3>
            <Link href="/reports"
              className="text-xs font-semibold flex items-center gap-1 transition-opacity hover:opacity-70"
              style={{ color: "#5B8CFF" }}>
              All analytics <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {MODULES.map((mod, i) => (
              <ModuleCard key={mod.href} mod={mod} score={moduleScores[mod.href] ?? null} delay={i * 0.06} />
            ))}
          </div>
        </div>

        {/* ══ BOTTOM ROW ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Daily Challenges */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border p-5 space-y-4"
            style={{ background: "rgba(8,14,30,0.7)", borderColor: "rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(252,211,77,0.1)", border: "1px solid rgba(252,211,77,0.2)" }}>
                  <Trophy className="w-4 h-4" style={{ color: "#FCD34D" }} />
                </div>
                <h3 className="text-sm font-bold text-white">Daily Challenges</h3>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1"
                style={{ background: "rgba(252,211,77,0.08)", color: "#FCD34D", border: "1px solid rgba(252,211,77,0.15)" }}>
                <Zap className="w-2.5 h-2.5" />
                +{challenges.reduce((s, c) => s + c.xpReward, 0)} XP today
              </span>
            </div>

            <div className="space-y-2">
              {challenges.map((c) => (
                <Link key={c.id} href={c.href}
                  className="group flex items-center gap-3 p-3 rounded-xl border transition-all duration-200"
                  style={{
                    background: c.completed ? "rgba(52,211,153,0.05)" : "rgba(255,255,255,0.02)",
                    borderColor: c.completed ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.05)",
                  }}>
                  <div className="flex-shrink-0 transition-transform group-hover:scale-110 duration-200">
                    {c.completed
                      ? <CheckCircle2 className="w-4 h-4" style={{ color: "#34D399" }} />
                      : <Circle className="w-4 h-4" style={{ color: "rgba(255,255,255,0.18)" }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs font-semibold", c.completed ? "line-through" : "text-white/80")}
                      style={c.completed ? { color: "rgba(52,211,153,0.5)" } : {}}>
                      {c.title}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>
                      +{c.xpReward} XP · {c.module}
                    </p>
                  </div>
                  {!c.completed && (
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0"
                      style={{ color: "#5B8CFF" }} />
                  )}
                </Link>
              ))}
            </div>

            {/* XP level bar */}
            <div className="pt-3 space-y-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white/70">
                  Level {gam.level} · {levelInfo.name}
                </span>
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                  {gam.xp} / {levelInfo.nextXP} XP
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #5B8CFF, #8B5CF6)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${lvlProgress}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </div>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                {levelInfo.nextXP - gam.xp} XP until next level
              </p>
            </div>
          </motion.div>

          {/* Company Readiness */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38 }}
            className="rounded-2xl border p-5 space-y-4"
            style={{ background: "rgba(8,14,30,0.7)", borderColor: "rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(91,140,255,0.1)", border: "1px solid rgba(91,140,255,0.2)" }}>
                  <Sparkles className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="text-sm font-bold text-white">Company Readiness</h3>
              </div>
            </div>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.22)" }}>
              Simulated estimates based on your scores
            </p>

            <div className="space-y-4">
              {companies.map((c, i) => (
                <motion.div key={c.company}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 + 0.4 }}
                >
                  <div className="flex items-end justify-between mb-1.5">
                    <div>
                      <p className="text-xs font-bold text-white/80 leading-none">{c.company}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.22)" }}>{c.sector}</p>
                    </div>
                    <span className="text-xs font-black tabular-nums ml-2"
                      style={{ color: c.likelihood >= 70 ? "#34D399" : c.likelihood >= 50 ? "#818CF8" : "#FBBF24" }}>
                      {c.likelihood}%
                    </span>
                  </div>
                  <div className="h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <motion.div className="h-full rounded-full"
                      style={{
                        background: c.likelihood >= 70
                          ? "linear-gradient(90deg, #10B981, #34D399)"
                          : c.likelihood >= 50
                          ? "linear-gradient(90deg, #5B8CFF, #8B5CF6)"
                          : "linear-gradient(90deg, #D97706, #FBBF24)",
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${c.likelihood}%` }}
                      transition={{ duration: 0.8, delay: i * 0.08 + 0.45 }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            {!hasData && (
              <div className="p-3 rounded-xl text-center mt-2"
                style={{ background: "rgba(91,140,255,0.06)", border: "1px solid rgba(91,140,255,0.12)" }}>
                <p className="text-xs font-medium" style={{ color: "rgba(129,140,248,0.7)" }}>
                  Complete modules to unlock your scores
                </p>
              </div>
            )}
          </motion.div>

          {/* Recent Sessions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.46 }}
            className="rounded-2xl border p-5"
            style={{ background: "rgba(8,14,30,0.7)", borderColor: "rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.18)" }}>
                  <Activity className="w-4 h-4" style={{ color: "#22D3EE" }} />
                </div>
                <h3 className="text-sm font-bold text-white">Recent Sessions</h3>
              </div>
              <Link href="/reports"
                className="text-[11px] font-semibold hover:opacity-70 transition-opacity"
                style={{ color: "#5B8CFF" }}>
                View all
              </Link>
            </div>

            {scores.recentSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(91,140,255,0.08)", border: "1px solid rgba(91,140,255,0.15)" }}>
                  <Brain className="w-7 h-7 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white/70 mb-1.5">No sessions yet</p>
                  <p className="text-xs leading-relaxed max-w-[170px]" style={{ color: "rgba(255,255,255,0.28)" }}>
                    Pick a module to start your first practice session
                  </p>
                </div>
                <Link href="/psychometric"
                  className="text-xs font-bold text-white rounded-xl px-5 py-2 transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #5B8CFF, #8B5CF6)", boxShadow: "0 4px 18px rgba(91,140,255,0.35)" }}>
                  Start practising
                </Link>
              </div>
            ) : (
              <div>
                {scores.recentSessions.map((s, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 + 0.4 }}
                    className="flex items-center justify-between py-3"
                    style={{ borderBottom: i < scores.recentSessions.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                  >
                    <div>
                      <p className="text-xs font-semibold text-white/80">{s.label}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.22)" }}>{timeAgo(s.date)}</p>
                    </div>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-base font-black tabular-nums"
                        style={{ color: s.score >= 75 ? "#34D399" : s.score >= 60 ? "#818CF8" : "#FBBF24" }}>
                        {s.score}
                      </span>
                      <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>/100</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* ══ SKILL RADAR ══ */}
        {hasData && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="rounded-2xl border p-6"
            style={{ background: "rgba(8,14,30,0.7)", borderColor: "rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(91,140,255,0.1)", border: "1px solid rgba(91,140,255,0.2)" }}>
                  <BarChart3 className="w-4.5 h-4.5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Skill Coverage</h3>
                  <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>
                    How you're tracking across all preparation areas
                  </p>
                </div>
              </div>
              <Link href="/reports"
                className="text-xs font-semibold flex items-center gap-1 hover:opacity-70 transition-opacity"
                style={{ color: "#5B8CFF" }}>
                Full report <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <ReadinessRadar data={scores.radarData} />
          </motion.div>
        )}

      </div>
    </div>
  )
}

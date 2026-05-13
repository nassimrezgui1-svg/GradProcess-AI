"use client"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Topbar } from "@/components/layout/topbar"
import { ReadinessRadar } from "@/components/charts/readiness-radar"
import { loadDashboardScores, DashboardScores } from "@/lib/scores"
import { loadProfile } from "@/lib/profile"
import {
  loadGamification, GamificationState, getTodaysChallenges,
  getCompanyReadiness, getLevelInfo, getLevelProgress
} from "@/lib/gamification"
import { cn, getScoreColor, getScoreRingColor, getScoreBand } from "@/lib/utils"
import {
  FileText, Mic2, Video, Brain, BookOpen, ClipboardList,
  ArrowRight, Flame, Zap, ChevronRight, Sparkles,
  TrendingUp, CheckCircle2, Circle, Clock
} from "lucide-react"
import Link from "next/link"

// ─── Animated ring ────────────────────────────────────────────────────────────

function ProgressRing({ score, size = 140 }: { score: number; size?: number }) {
  const [count, setCount] = useState(0)
  const r = (size - 16) / 2
  const circ = 2 * Math.PI * r

  useEffect(() => {
    let frame: number
    const start = performance.now()
    const dur = 1200
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setCount(Math.round(ease * score))
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [score])

  const color = getScoreRingColor(score)
  const band = getScoreBand(score)

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F3F5F9" strokeWidth={10} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={10} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (score / 100) * circ }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-ink tabular-nums">{count}</span>
        <span className="text-xs text-ink-faint">/100</span>
      </div>
    </div>
  )
}

// ─── Module cards config ──────────────────────────────────────────────────────

const MODULES = [
  {
    href: "/cv-tailoring",
    label: "CV & ATS",
    description: "Optimise your CV for applicant tracking systems",
    icon: FileText,
    gradient: "from-blue-50 to-indigo-50",
    iconBg: "bg-brand-blue-light",
    iconColor: "text-brand-blue",
    accent: "border-brand-blue/20",
    xp: 50,
  },
  {
    href: "/star-builder",
    label: "STAR Builder",
    description: "Build compelling competency interview answers",
    icon: Mic2,
    gradient: "from-amber-50 to-orange-50",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    accent: "border-amber-200",
    xp: 30,
  },
  {
    href: "/video-interview",
    label: "Video Interview",
    description: "Practice with an AI recruiter and get scored",
    icon: Video,
    gradient: "from-rose-50 to-pink-50",
    iconBg: "bg-rose-50",
    iconColor: "text-rose-400",
    accent: "border-rose-200",
    xp: 60,
  },
  {
    href: "/psychometric",
    label: "Psychometric Tests",
    description: "Sharpen your numerical, verbal & logical skills",
    icon: Brain,
    gradient: "from-purple-50 to-violet-50",
    iconBg: "bg-brand-purple-light",
    iconColor: "text-brand-purple",
    accent: "border-brand-purple/20",
    xp: 40,
  },
  {
    href: "/industry-hub",
    label: "Industry Hub",
    description: "Stay sharp with live sector news & insights",
    icon: BookOpen,
    gradient: "from-teal-50 to-cyan-50",
    iconBg: "bg-brand-teal-light",
    iconColor: "text-teal-500",
    accent: "border-teal-200",
    xp: 20,
  },
  {
    href: "/full-process-exam",
    label: "Full Process Exam",
    description: "Simulate a complete graduate application",
    icon: ClipboardList,
    gradient: "from-orange-50 to-amber-50",
    iconBg: "bg-orange-50",
    iconColor: "text-orange-400",
    accent: "border-orange-200",
    xp: 100,
  },
]

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

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [scores, setScores] = useState<DashboardScores | null>(null)
  const [gam, setGam] = useState<GamificationState | null>(null)
  const [profile, setProfile] = useState({ name: "" })

  useEffect(() => {
    setScores(loadDashboardScores())
    setGam(loadGamification())
    setProfile(loadProfile())
  }, [])

  if (!scores || !gam) {
    return (
      <div className="flex flex-col min-h-full">
        <Topbar title="Dashboard" />
        <div className="flex-1 p-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 rounded-3xl shimmer" />
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
    "/cv-tailoring": scores.cv,
    "/star-builder": scores.star,
    "/video-interview": scores.video,
    "/psychometric": scores.psychometric,
    "/industry-hub": null,
    "/full-process-exam": null,
  }

  const firstName = profile.name ? profile.name.split(" ")[0] : null
  const daysToReady = hasData && overall < 85 ? Math.max(5, Math.round((85 - overall) * 0.9)) : null
  const completedModules = [scores.cv, scores.star, scores.video, scores.psychometric].filter(s => s !== null).length

  const motivationalLine = !hasData
    ? "Start with one module to begin tracking your progress."
    : overall >= 85 ? "You're application-ready. Keep refining to stand out."
    : overall >= 70 ? `You're ${85 - overall} points away from Application Ready — keep going!`
    : `${completedModules} of 4 modules complete. Every session moves you forward.`

  return (
    <div className="flex flex-col min-h-full bg-surface">
      <Topbar title="Dashboard" />

      <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">

        {/* ── WELCOME HERO ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-3xl border border-surface-border shadow-card p-6 sm:p-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            {/* Text side */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">👋</span>
                <h2 className="text-xl sm:text-2xl font-bold text-ink">
                  {getGreeting()}{firstName ? `, ${firstName}` : ""}
                </h2>
              </div>
              <p className="text-ink-muted text-sm sm:text-base mb-4 max-w-lg">{motivationalLine}</p>

              {/* Streak + XP strip */}
              <div className="flex flex-wrap items-center gap-3">
                {gam.streakDays > 0 && (
                  <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-100 text-orange-600 rounded-full px-3 py-1.5 text-xs font-semibold">
                    <Flame className="w-3.5 h-3.5" />
                    {gam.streakDays}-day streak
                  </div>
                )}
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 text-amber-600 rounded-full px-3 py-1.5 text-xs font-semibold">
                  <Zap className="w-3.5 h-3.5" />
                  {gam.xp} XP · {levelInfo.name}
                </div>
                {hasData && (
                  <div className="flex items-center gap-1.5 bg-brand-purple-light border border-brand-purple/20 text-brand-purple rounded-full px-3 py-1.5 text-xs font-semibold">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {completedModules}/4 modules active
                  </div>
                )}
              </div>

              {daysToReady && (
                <p className="mt-3 text-xs text-ink-faint flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  At your current pace, you could be Application Ready in ~{daysToReady} days
                </p>
              )}
            </div>

            {/* Score ring */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <ProgressRing score={overall} size={140} />
              <div className="text-center">
                <p className="text-sm font-semibold text-ink">{band.emoji} {band.label}</p>
                <p className="text-xs text-ink-faint">Overall Readiness</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── MODULE CARDS ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-ink">Your Modules</h3>
            <Link href="/reports" className="text-xs text-brand-purple hover:text-brand-blue font-medium flex items-center gap-1 transition-colors">
              Full analytics <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MODULES.map((mod, i) => {
              const score = moduleScores[mod.href]
              const Icon = mod.icon
              return (
                <motion.div
                  key={mod.href}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.07 }}
                >
                  <Link href={mod.href} className="group block h-full">
                    <div className={cn(
                      "bg-white border rounded-3xl p-5 shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5 h-full flex flex-col",
                      mod.accent
                    )}>
                      {/* Icon */}
                      <div className="flex items-start justify-between mb-3">
                        <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center", mod.iconBg)}>
                          <Icon className={cn("w-5 h-5", mod.iconColor)} />
                        </div>
                        <span className="text-xs text-ink-faint bg-surface-muted rounded-full px-2.5 py-1 font-medium flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5 text-amber-400" />+{mod.xp} XP
                        </span>
                      </div>

                      {/* Text */}
                      <h4 className="text-sm font-bold text-ink mb-1">{mod.label}</h4>
                      <p className="text-xs text-ink-muted leading-relaxed flex-1">{mod.description}</p>

                      {/* Progress */}
                      <div className="mt-4">
                        {score !== null ? (
                          <>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs text-ink-faint">Score</span>
                              <span className={cn("text-sm font-bold tabular-nums", getScoreColor(score))}>{score}/100</span>
                            </div>
                            <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
                              <motion.div
                                className={cn("h-full rounded-full", score >= 75 ? "bg-emerald-400" : score >= 60 ? "bg-brand-blue" : "bg-amber-400")}
                                initial={{ width: 0 }}
                                animate={{ width: `${score}%` }}
                                transition={{ duration: 0.8, delay: i * 0.07 + 0.3 }}
                              />
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-ink-faint">Not started yet</span>
                            <span className="text-xs font-semibold text-brand-purple group-hover:gap-1.5 flex items-center gap-1 transition-all">
                              Start <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* ── BOTTOM ROW: Challenges + Company Readiness + Recent ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Daily challenges */}
          <div className="bg-white rounded-3xl border border-surface-border shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-ink">Today's Challenges</h3>
              <div className="flex items-center gap-1 text-xs font-semibold text-amber-500 bg-amber-50 border border-amber-100 rounded-full px-2.5 py-1">
                <Zap className="w-3 h-3" />
                +{challenges.reduce((s, c) => s + c.xpReward, 0)} XP
              </div>
            </div>
            <div className="space-y-2.5">
              {challenges.map((c, i) => (
                <Link key={c.id} href={c.href}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-2xl border transition-all group",
                    c.completed
                      ? "bg-emerald-50 border-emerald-100 opacity-70"
                      : "bg-surface-muted border-surface-border hover:border-brand-purple/30 hover:bg-brand-purple-light/40"
                  )}>
                  <div className="flex-shrink-0">
                    {c.completed
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      : <Circle className="w-4 h-4 text-ink-faint group-hover:text-brand-purple transition-colors" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs font-semibold", c.completed ? "text-emerald-600 line-through" : "text-ink")}>{c.title}</p>
                    <p className="text-xs text-ink-faint mt-0.5">+{c.xpReward} XP · {c.module}</p>
                  </div>
                  {!c.completed && <ArrowRight className="w-3.5 h-3.5 text-ink-faint group-hover:text-brand-purple flex-shrink-0" />}
                </Link>
              ))}
            </div>

            {/* Level progress */}
            <div className="mt-5 pt-4 border-t border-surface-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-ink">Level {gam.level} · {levelInfo.name}</span>
                <span className="text-xs text-ink-faint">{gam.xp} / {levelInfo.nextXP} XP</span>
              </div>
              <div className="h-2 bg-surface-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-brand-purple to-brand-blue rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${lvlProgress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <p className="text-xs text-ink-faint mt-1.5">{levelInfo.nextXP - gam.xp} XP to level up</p>
            </div>
          </div>

          {/* Company readiness */}
          <div className="bg-white rounded-3xl border border-surface-border shadow-card p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-ink">Company Readiness</h3>
              <Sparkles className="w-4 h-4 text-brand-purple" />
            </div>
            <p className="text-xs text-ink-faint mb-4">Simulated estimates based on your scores</p>
            <div className="space-y-3">
              {companies.map((c, i) => (
                <motion.div key={c.company}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-24 flex-shrink-0">
                    <p className="text-xs font-semibold text-ink truncate">{c.company}</p>
                    <p className="text-xs text-ink-faint">{c.sector}</p>
                  </div>
                  <div className="flex-1 h-2 bg-surface-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: c.likelihood >= 70 ? "#4ADE80" : c.likelihood >= 50 ? "#5B8DEF" : "#FBBF24" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${c.likelihood}%` }}
                      transition={{ duration: 0.7, delay: i * 0.08 + 0.2 }}
                    />
                  </div>
                  <span className={cn(
                    "text-xs font-bold w-8 text-right tabular-nums",
                    c.likelihood >= 70 ? "text-emerald-500" : c.likelihood >= 50 ? "text-brand-blue" : "text-amber-500"
                  )}>{c.likelihood}%</span>
                </motion.div>
              ))}
            </div>
            {!hasData && (
              <div className="mt-4 p-3 bg-brand-purple-light rounded-2xl border border-brand-purple/15 text-center">
                <p className="text-xs text-brand-purple font-medium">Complete modules to see your company readiness scores</p>
              </div>
            )}
          </div>

          {/* Recent sessions */}
          <div className="bg-white rounded-3xl border border-surface-border shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-ink">Recent Sessions</h3>
              <Link href="/reports" className="text-xs text-brand-purple hover:text-brand-blue font-medium">View all</Link>
            </div>

            {scores.recentSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 bg-brand-purple-light rounded-2xl flex items-center justify-center mb-3">
                  <Brain className="w-6 h-6 text-brand-purple" />
                </div>
                <p className="text-sm font-semibold text-ink mb-1">No sessions yet</p>
                <p className="text-xs text-ink-faint mb-3">Pick any module above to start your first practice session</p>
                <Link href="/psychometric" className="text-xs bg-brand-purple text-white rounded-full px-4 py-1.5 font-semibold hover:bg-brand-blue transition-colors">
                  Start practising
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                {scores.recentSessions.map((s, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center justify-between py-2.5 border-b border-surface-border last:border-0"
                  >
                    <div>
                      <p className="text-xs font-semibold text-ink">{s.label}</p>
                      <p className="text-xs text-ink-faint">{timeAgo(s.date)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={cn("text-sm font-bold tabular-nums", getScoreColor(s.score))}>{s.score}</span>
                      <span className="text-ink-faint text-xs">/100</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* ── SKILL RADAR (collapsible bottom) ── */}
        {hasData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-3xl border border-surface-border shadow-card p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-ink">Skill Coverage</h3>
              <Link href="/reports" className="text-xs text-brand-purple hover:text-brand-blue font-medium flex items-center gap-1">
                Detailed report <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <p className="text-xs text-ink-faint mb-4">How you're tracking across all preparation areas</p>
            <ReadinessRadar data={scores.radarData} />
          </motion.div>
        )}

      </div>
    </div>
  )
}

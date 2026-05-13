"use client"
import { motion } from "framer-motion"
import { getLevelInfo, getLevelProgress } from "@/lib/gamification"
import { Zap } from "lucide-react"

export function XPBar({ xp, compact = false }: { xp: number; compact?: boolean }) {
  const info = getLevelInfo(xp)
  const progress = getLevelProgress(xp)

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Zap className="w-3 h-3 text-amber-400 flex-shrink-0" />
        <div className="flex-1 h-1.5 bg-surface-border rounded-full overflow-hidden">
          <motion.div className="h-full bg-gradient-to-r from-brand-purple to-brand-blue rounded-full"
            initial={{ width: 0 }} animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }} />
        </div>
        <span className="text-xs text-amber-500 font-bold">{xp} XP</span>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-semibold text-ink">{info.name}</span>
        </div>
        <span className="text-xs text-ink-faint">{xp} / {info.nextXP} XP</span>
      </div>
      <div className="h-2 bg-surface-muted rounded-full overflow-hidden">
        <motion.div className="h-full bg-gradient-to-r from-brand-purple to-brand-blue rounded-full"
          initial={{ width: 0 }} animate={{ width: `${progress}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }} />
      </div>
      <p className="text-xs text-ink-faint">{info.nextXP - xp} XP to next level</p>
    </div>
  )
}

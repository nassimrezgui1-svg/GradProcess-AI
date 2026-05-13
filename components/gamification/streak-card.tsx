"use client"
import { motion } from "framer-motion"
import { Flame } from "lucide-react"

export function StreakCard({ days, compact = false }: { days: number; compact?: boolean }) {
  const hot = days >= 3

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <motion.div animate={hot ? { scale: [1, 1.15, 1] } : {}} transition={{ repeat: Infinity, duration: 2 }}>
          <Flame className={`w-4 h-4 ${hot ? "text-orange-400" : "text-ink-faint"}`} />
        </motion.div>
        <span className={`text-sm font-bold ${hot ? "text-orange-500" : "text-ink-faint"}`}>{days}d</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div animate={hot ? { scale: [1, 1.1, 1] } : {}} transition={{ repeat: Infinity, duration: 3 }}>
        <Flame className={`w-6 h-6 ${hot ? "text-orange-400" : "text-ink-faint"}`} />
      </motion.div>
      <span className={`text-xl font-bold ${hot ? "text-orange-500" : "text-ink-faint"}`}>{days}</span>
      <span className="text-xs text-ink-faint">day streak</span>
    </div>
  )
}

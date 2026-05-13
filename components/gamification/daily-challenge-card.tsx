"use client"
import { motion } from "framer-motion"
import { CheckCircle2, Circle, Zap, ArrowRight } from "lucide-react"
import { DailyChallenge, completeChallenge } from "@/lib/gamification"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface DailyChallengeCardProps {
  challenges: DailyChallenge[]
  onComplete?: () => void
}

const moduleColors: Record<string, string> = {
  CV: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Psychometric: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  STAR: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  Industry: "bg-green-500/10 text-green-400 border-green-500/20",
  Video: "bg-red-500/10 text-red-400 border-red-500/20",
}

export function DailyChallengeCard({ challenges, onComplete }: DailyChallengeCardProps) {
  const completed = challenges.filter(c => c.completed).length

  return (
    <div className="bg-[#0d1424] border border-white/8 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Daily Challenges</h3>
          <p className="text-xs text-gray-500 mt-0.5">{completed}/{challenges.length} completed today</p>
        </div>
        <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-2.5 py-1">
          <Zap className="w-3 h-3 text-yellow-400" />
          <span className="text-xs font-bold text-yellow-400">+{challenges.reduce((s, c) => s + c.xpReward, 0)} XP</span>
        </div>
      </div>

      <div className="space-y-2">
        {challenges.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link href={c.href} className={cn(
              "flex items-center gap-3 p-3 rounded-xl border transition-all group",
              c.completed
                ? "bg-green-500/5 border-green-500/20 opacity-60"
                : "bg-white/3 border-white/8 hover:border-white/20 hover:bg-white/5"
            )}>
              <div className="flex-shrink-0">
                {c.completed
                  ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                  : <Circle className="w-4 h-4 text-gray-600 group-hover:text-gray-400" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-xs font-medium", c.completed ? "text-gray-500 line-through" : "text-white")}>{c.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={cn("text-xs px-1.5 py-0.5 rounded border", moduleColors[c.module] || "bg-gray-500/10 text-gray-400 border-gray-500/20")}>
                    {c.module}
                  </span>
                  <span className="text-xs text-yellow-500/70">+{c.xpReward} XP</span>
                </div>
              </div>
              {!c.completed && <ArrowRight className="w-3 h-3 text-gray-600 group-hover:text-gray-300 flex-shrink-0" />}
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

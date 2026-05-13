"use client"
import { cn, getScoreColor, getScoreBg, getScoreLabel } from "@/lib/utils"
import React from "react"

interface ScoreCardProps {
  title: string
  score: number
  subtitle?: string
  icon?: React.ReactNode
  trend?: number
  className?: string
  size?: "sm" | "md" | "lg"
}

export function ScoreCard({ title, score, subtitle, icon, trend, className, size = "md" }: ScoreCardProps) {
  const scoreColor = getScoreColor(score)
  const label = getScoreLabel(score)

  return (
    <div className={cn(
      "bg-white rounded-2xl shadow-sm border border-gray-100",
      size === "sm" && "p-4",
      size === "md" && "p-6",
      size === "lg" && "p-8",
      className
    )}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      <div className="flex items-end gap-2">
        <span className={cn("font-bold", scoreColor, size === "sm" ? "text-2xl" : "text-4xl")}>{score}</span>
        <span className="text-gray-400 text-lg mb-1">/100</span>
      </div>
      <div className="mt-3">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-700", getScoreBg(score))}
            style={{ width: `${score}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className={cn("text-xs font-medium", scoreColor)}>{label}</span>
          {trend !== undefined && (
            <span className={cn("text-xs", trend >= 0 ? "text-green-500" : "text-red-500")}>
              {trend >= 0 ? "+" : ""}{trend} pts
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

"use client"
import { cn, getScoreColor, getScoreLabel } from "@/lib/utils"

interface ReadinessGaugeProps {
  score: number
  size?: number
  className?: string
}

export function ReadinessGauge({ score, size = 180, className }: ReadinessGaugeProps) {
  const radius = (size / 2) - 16
  const circumference = radius * Math.PI
  const offset = circumference - (score / 100) * circumference
  const scoreColor = getScoreColor(score)
  const strokeColor = score >= 75 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444"

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
        <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
          {/* Background arc */}
          <path
            d={`M 16 ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - 16} ${size / 2 + 10}`}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Score arc */}
          <path
            d={`M 16 ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - 16} ${size / 2 + 10}`}
            fill="none"
            stroke={strokeColor}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={`${offset}`}
            style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <span className={cn("font-bold", scoreColor, "text-5xl")}>{score}</span>
          <span className="text-gray-400 text-sm">out of 100</span>
        </div>
      </div>
      <span className={cn("text-lg font-semibold mt-2", scoreColor)}>{getScoreLabel(score)}</span>
    </div>
  )
}

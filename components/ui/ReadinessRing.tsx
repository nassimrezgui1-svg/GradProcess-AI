"use client"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"

function ringColor(score: number) {
  if (score >= 75) return "#4ADE80"
  if (score >= 60) return "#3B82F6"
  if (score >= 40) return "#FBBF24"
  return "#FB7185"
}

function ringLabel(score: number) {
  if (score >= 85) return "Application Ready"
  if (score >= 75) return "Strong Candidate"
  if (score >= 60) return "Developing Well"
  if (score >= 40) return "Early Stage"
  return "Getting Started"
}

interface ReadinessRingProps {
  score: number
  size?: number
  strokeWidth?: number
  showLabel?: boolean
}

export function ReadinessRing({
  score,
  size = 140,
  strokeWidth = 10,
  showLabel = true,
}: ReadinessRingProps) {
  const [count, setCount] = useState(0)
  const r = (size - strokeWidth * 2) / 2
  const circ = 2 * Math.PI * r
  const color = ringColor(score)

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

  return (
    <div className="relative flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Track */}
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke="rgba(148,163,184,0.1)"
            strokeWidth={strokeWidth}
          />
          {/* Progress */}
          <motion.circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - (score / 100) * circ }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 6px ${color}66)` }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="font-bold text-white tabular-nums" style={{ fontSize: size * 0.22 }}>
            {count}
          </span>
          <span className="text-slate-400" style={{ fontSize: size * 0.1 }}>/100</span>
        </div>
      </div>
      {showLabel && (
        <p className="text-xs font-semibold" style={{ color }}>{ringLabel(score)}</p>
      )}
    </div>
  )
}

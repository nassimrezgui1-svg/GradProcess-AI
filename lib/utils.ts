import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getScoreColor(score: number): string {
  if (score >= 75) return "text-emerald-500"
  if (score >= 60) return "text-blue-500"
  if (score >= 40) return "text-amber-500"
  return "text-rose-400"
}

export function getScoreBg(score: number): string {
  if (score >= 75) return "bg-emerald-400"
  if (score >= 60) return "bg-blue-400"
  if (score >= 40) return "bg-amber-400"
  return "bg-rose-400"
}

/**
 * The single source of truth for readiness banding.
 *
 * Every surface that labels a score must derive it from here. Four separate
 * implementations previously disagreed — the same 65/100 read as "Developing
 * Well" on the Dashboard and "Strong Foundation" on Reports, with different
 * thresholds again in the Video Interview and ReadinessRing — which made the
 * scoring itself look arbitrary.
 */
export function getScoreBand(score: number): { label: string; color: string; emoji: string } {
  if (score >= 90) return { label: "Application Ready", color: "text-emerald-600", emoji: "✨" }
  if (score >= 75) return { label: "Strong Progress", color: "text-blue-600", emoji: "🚀" }
  if (score >= 60) return { label: "Developing Well", color: "text-blue-500", emoji: "📈" }
  if (score >= 40) return { label: "Keep Improving", color: "text-amber-600", emoji: "💪" }
  return { label: "Just Getting Started", color: "text-rose-500", emoji: "🌱" }
}

export function getScoreLabel(score: number): string {
  const { label, emoji } = getScoreBand(score)
  return score >= 75 ? `${label} ${emoji}` : label
}

export function getScoreRingColor(score: number): string {
  if (score >= 75) return "#4ADE80"
  if (score >= 60) return "#5B8DEF"
  if (score >= 40) return "#FBBF24"
  return "#FB7185"
}

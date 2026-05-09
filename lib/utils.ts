import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getScoreColor(score: number): string {
  if (score >= 75) return "text-green-500"
  if (score >= 40) return "text-amber-500"
  return "text-red-500"
}

export function getScoreBg(score: number): string {
  if (score >= 75) return "bg-green-500"
  if (score >= 40) return "bg-amber-500"
  return "bg-red-500"
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return "Application Ready"
  if (score >= 75) return "Strong"
  if (score >= 60) return "Developing"
  if (score >= 40) return "Needs Work"
  return "Not Ready"
}

export function getScoreBand(score: number): { label: string; color: string } {
  if (score >= 90) return { label: "Excellent", color: "text-green-400" }
  if (score >= 75) return { label: "Strong", color: "text-green-500" }
  if (score >= 60) return { label: "Developing", color: "text-amber-400" }
  if (score >= 40) return { label: "Needs Improvement", color: "text-amber-500" }
  return { label: "High Risk", color: "text-red-500" }
}

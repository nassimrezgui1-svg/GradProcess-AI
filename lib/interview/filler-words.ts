import type { FillerWordResult } from "./types"

const FILLERS = ["um", "uh", "like", "basically", "literally", "sort of", "kind of", "you know", "actually", "so", "okay", "right", "well", "just", "honestly"]

export function detectFillerWords(transcript: string, durationSeconds: number): FillerWordResult {
  const lower = transcript.toLowerCase()
  const breakdown: Record<string, number> = {}
  let total = 0

  for (const filler of FILLERS) {
    // word-boundary match
    const regex = new RegExp(`\\b${filler.replace(/ /g, "\\s+")}\\b`, "gi")
    const matches = lower.match(regex)
    if (matches && matches.length > 0) {
      breakdown[filler] = matches.length
      total += matches.length
    }
  }

  const minutes = Math.max(durationSeconds / 60, 0.1)
  const perMinute = Math.round(total / minutes)

  let severity: "low" | "medium" | "high" = "low"
  if (perMinute >= 15) severity = "high"
  else if (perMinute >= 8) severity = "medium"

  return { total, perMinute, breakdown, severity }
}

export function getFillerFeedback(result: FillerWordResult): string {
  if (result.total === 0) return "Excellent — no filler words detected."
  if (result.severity === "low") return `Good control — ${result.total} filler word${result.total > 1 ? "s" : ""} at ${result.perMinute}/min. Keep working on fluency.`
  if (result.severity === "medium") return `${result.total} filler words at ${result.perMinute}/min. Focus on pausing instead of filling silence.`
  const topFiller = Object.entries(result.breakdown).sort(([, a], [, b]) => b - a)[0]
  return `High filler frequency (${result.perMinute}/min). "${topFiller?.[0]}" appeared ${topFiller?.[1]} times. Practise pausing in silence rather than filling gaps.`
}

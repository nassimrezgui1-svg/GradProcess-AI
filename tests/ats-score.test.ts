import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * The headline "ATS Pass Score" was asked of the model directly, and it
 * produced a number unrelated to its own findings. Measured against one job
 * spec:
 *
 *   CV matching 13 requirements (68% keyword coverage) -> 62
 *   CV matching  8 requirements (50% keyword coverage) -> 62
 *
 * The same CV also scored 62 on one run and 72 on the next, and the figure was
 * not the mean of its own breakdown (61 vs 72). Its component judgements were
 * sound and did discriminate, so the headline number is now derived from them
 * and from countable keyword coverage.
 *
 * After the change: strong 67, mid 59 (twice), unrelated CV 5.
 */

const route = readFileSync(
  join(__dirname, "..", "app", "api", "ai", "analyse-cv", "route.ts"), "utf8")

const WEIGHTS: Record<string, number> = {
  keywordMatch: 0.30, skillsAlignment: 0.20, experienceRelevance: 0.20,
  educationAlignment: 0.10, quantifiedImpact: 0.10,
  formattingReadability: 0.05, grammarClarity: 0.05,
}

/** Mirrors the route so the rule itself is under test. */
function score(result: any): number {
  const b = result.breakdown ?? {}
  const matched = result.matchedKeywords?.length ?? 0
  const missing = result.missingKeywords?.length ?? 0
  const coverage = matched + missing > 0 ? (matched / (matched + missing)) * 100 : null
  const keyword = coverage === null
    ? Number(b.keywordMatch ?? 0)
    : (Number(b.keywordMatch ?? coverage) + coverage) / 2
  let total = 0, used = 0
  for (const [dim, w] of Object.entries(WEIGHTS)) {
    const v = dim === "keywordMatch" ? keyword : b[dim]
    if (typeof v !== "number" || Number.isNaN(v)) continue
    total += v * w; used += w
  }
  return used === 0 ? 0 : Math.max(0, Math.min(100, Math.round(total / used)))
}

const strong = {
  breakdown: { keywordMatch: 82, skillsAlignment: 80, experienceRelevance: 85,
    educationAlignment: 90, quantifiedImpact: 15, formattingReadability: 20, grammarClarity: 55 },
  matchedKeywords: Array(13).fill("k"), missingKeywords: Array(7).fill("m"),
}
const mid = {
  breakdown: { keywordMatch: 68, skillsAlignment: 70, experienceRelevance: 75,
    educationAlignment: 80, quantifiedImpact: 20, formattingReadability: 30, grammarClarity: 55 },
  matchedKeywords: Array(8).fill("k"), missingKeywords: Array(8).fill("m"),
}

describe("the ATS score is derived, not guessed", () => {
  it("separates a strong CV from a middling one", () => {
    // These scored identically (62/62) when the model produced the number.
    expect(score(strong)).toBeGreaterThan(score(mid))
  })

  it("gives the same input the same score every time", () => {
    expect(score(mid)).toBe(score(mid))
    expect(score(strong)).toBe(score(strong))
  })

  it("moves when keyword coverage moves, holding everything else equal", () => {
    const better = { ...mid, matchedKeywords: Array(14).fill("k"), missingKeywords: Array(2).fill("m") }
    expect(score(better)).toBeGreaterThan(score(mid))
  })

  it("scores an unrelated CV near the floor", () => {
    const unrelated = {
      breakdown: { keywordMatch: 5, skillsAlignment: 5, experienceRelevance: 5,
        educationAlignment: 10, quantifiedImpact: 0, formattingReadability: 20, grammarClarity: 40 },
      matchedKeywords: ["teamwork"], missingKeywords: Array(15).fill("m"),
    }
    expect(score(unrelated)).toBeLessThan(20)
  })

  it("stays inside 0-100 even with absurd input", () => {
    const silly = { breakdown: { keywordMatch: 400, skillsAlignment: -80 },
      matchedKeywords: [], missingKeywords: [] }
    const s = score(silly)
    expect(s).toBeGreaterThanOrEqual(0)
    expect(s).toBeLessThanOrEqual(100)
  })
})

describe("the route computes the figure rather than asking for it", () => {
  it("overrides whatever the model returned", () => {
    expect(route).toMatch(/result\.overallScore = computeOverallScore\(result\)/)
  })

  it("no longer asks the model for the headline score or label", () => {
    const prompt = route.slice(route.indexOf("Return ONLY this JSON structure"))
    expect(prompt).not.toMatch(/"overallScore":/)
    expect(prompt).not.toMatch(/"passLikelihood":/)
  })

  it("derives the label from the score so the two cannot disagree", () => {
    expect(route).toMatch(/result\.passLikelihood = passLikelihoodFor\(result\.overallScore\)/)
  })

  it("weights keyword and skills matching most heavily, as an ATS does", () => {
    const m = route.match(/keywordMatch:\s*([\d.]+)/)
    expect(m).not.toBeNull()
    expect(Number(m![1])).toBeGreaterThanOrEqual(0.25)
  })
})

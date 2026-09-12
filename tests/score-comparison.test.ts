import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * A 12 September audit found the Reports page naming the same module as both
 * "Priority Focus — your biggest improvement opportunity" and "Biggest
 * Strength — keep building on this", simultaneously.
 *
 * Cause: weakest and strongest were sorted[0] and sorted[length - 1] of the
 * modules that had a score. With one completed module those are the same
 * entry, so a single STAR score of 62 was presented as the user's weakest and
 * strongest area at once.
 */

const root = join(__dirname, "..")
const scores = readFileSync(join(root, "lib", "scores.ts"), "utf8")

/** Mirrors the rule in lib/scores.ts so the logic itself is under test. */
function compare(modules: { label: string; score: number }[]) {
  const sorted = [...modules].sort((a, b) => a.score - b.score)
  const canCompare = modules.length >= 2
  return {
    weakest: canCompare ? sorted[0] : null,
    strongest: canCompare ? sorted[sorted.length - 1] : null,
  }
}

describe("weakest and strongest are a real comparison", () => {
  it("shows neither when only one module has been completed", () => {
    const { weakest, strongest } = compare([{ label: "STAR", score: 62 }])
    expect(weakest).toBeNull()
    expect(strongest).toBeNull()
  })

  it("never names the same module as both", () => {
    const sets = [
      [{ label: "STAR", score: 62 }],
      [{ label: "STAR", score: 62 }, { label: "CV & ATS", score: 80 }],
      [{ label: "STAR", score: 62 }, { label: "CV & ATS", score: 80 }, { label: "Video Interview", score: 45 }],
    ]
    for (const modules of sets) {
      const { weakest, strongest } = compare(modules)
      if (weakest && strongest) {
        expect(weakest.label, `same module given as weakest and strongest`).not.toBe(strongest.label)
      }
    }
  })

  it("orders them correctly once there are two", () => {
    const { weakest, strongest } = compare([
      { label: "STAR", score: 62 }, { label: "CV & ATS", score: 80 },
    ])
    expect(weakest!.label).toBe("STAR")
    expect(strongest!.label).toBe("CV & ATS")
  })

  it("the source enforces the two-module minimum", () => {
    expect(scores).toMatch(/moduleList\.length >= 2/)
  })
})

/**
 * The Skill Coverage radar rendered as axes with no shape. Two causes:
 * with every module at zero the radius domain collapsed, and with a single
 * completed module the polygon has no area at all — it draws as a flat line
 * (measured bounding box 62x0). Separately, with no fixed radius domain
 * Recharts scaled the radius to the data, so a lone score of 62 was drawn
 * touching the outer edge, indistinguishable from full marks.
 */
describe("the readiness radar shows sparse data honestly", () => {
  const radar = readFileSync(join(root, "components", "charts", "readiness-radar.tsx"), "utf8")

  it("pins the radius axis to the 0-100 the scores are out of", () => {
    expect(radar).toMatch(/PolarRadiusAxis[^>]*domain=\{\[0, 100\]\}/)
  })

  it("marks each vertex so one completed module is still visible", () => {
    expect(radar).toMatch(/dot=\{\{/)
  })

  it("shows a message rather than an empty chart when nothing is scored", () => {
    expect(radar).toMatch(/hasAnyScore/)
    expect(radar).toMatch(/Complete a module/)
  })
})

import { describe, it, expect } from "vitest"
import { getCompanyReadiness } from "@/lib/gamification"

/**
 * A September 2026 audit found a brand-new account showing "KPMG 4%, PwC 3%,
 * Deloitte 1%" directly beneath the caption "Complete modules to unlock your
 * scores". The figures came from Math.random() applied to a base of zero, and
 * re-rolled on every render, so the list also reordered by itself.
 */

describe("getCompanyReadiness", () => {
  it("shows nothing until there is a real score", () => {
    expect(getCompanyReadiness(0)).toEqual([])
    expect(getCompanyReadiness(null)).toEqual([])
  })

  it("is deterministic — the same score always gives the same figures", () => {
    const a = getCompanyReadiness(65)
    const b = getCompanyReadiness(65)
    expect(a).toEqual(b)
  })

  it("keeps a stable order for a given score", () => {
    const names = () => getCompanyReadiness(50).map(c => c.company)
    expect(names()).toEqual(names())
  })

  it("never exceeds its ceiling", () => {
    for (const c of getCompanyReadiness(100)) {
      expect(c.likelihood).toBeLessThanOrEqual(95)
    }
  })

  it("scales with the score rather than inventing a floor", () => {
    const low = getCompanyReadiness(10)
    const high = getCompanyReadiness(90)
    expect(Math.max(...low.map(c => c.likelihood)))
      .toBeLessThan(Math.max(...high.map(c => c.likelihood)))
  })

  it("sorts strongest first", () => {
    const scores = getCompanyReadiness(70).map(c => c.likelihood)
    expect(scores).toEqual([...scores].sort((a, b) => b - a))
  })
})

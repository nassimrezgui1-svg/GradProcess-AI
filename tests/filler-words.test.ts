import { describe, it, expect } from "vitest"
import { detectFillerWords, getFillerFeedback } from "@/lib/interview/filler-words"

describe("detectFillerWords", () => {
  it("returns zero for a clean transcript", () => {
    const r = detectFillerWords("I led the project and delivered it on time.", 60)
    expect(r.total).toBe(0)
    expect(r.severity).toBe("low")
  })

  it("counts single-word fillers with word boundaries", () => {
    const r = detectFillerWords("Um, I think, um, we did well.", 60)
    expect(r.breakdown["um"]).toBe(2)
  })

  it("does not match fillers inside other words", () => {
    // "umbrella" contains "um" but must not count
    const r = detectFillerWords("The umbrella policy was solid.", 60)
    expect(r.breakdown["um"]).toBeUndefined()
  })

  it("counts multi-word fillers across whitespace", () => {
    const r = detectFillerWords("It was sort of hard, you know, kind of tricky.", 60)
    expect(r.breakdown["sort of"]).toBe(1)
    expect(r.breakdown["you know"]).toBe(1)
    expect(r.breakdown["kind of"]).toBe(1)
  })

  it("flags high severity at >=15 fillers per minute", () => {
    const r = detectFillerWords("um ".repeat(20), 60)
    expect(r.perMinute).toBeGreaterThanOrEqual(15)
    expect(r.severity).toBe("high")
  })

  it("guards against divide-by-zero on zero duration", () => {
    const r = detectFillerWords("um um um", 0)
    expect(Number.isFinite(r.perMinute)).toBe(true)
  })
})

describe("getFillerFeedback", () => {
  it("praises a clean answer", () => {
    const r = detectFillerWords("Clear and confident answer.", 60)
    expect(getFillerFeedback(r)).toMatch(/Excellent/)
  })

  it("names the top filler at high severity", () => {
    const r = detectFillerWords("um ".repeat(20), 60)
    expect(getFillerFeedback(r)).toContain("um")
  })
})

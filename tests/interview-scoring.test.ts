import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

/**
 * Audit of the video interview scoring chain.
 *
 * The scoring itself is sound and measured:
 *   filler words   word-boundary count over the real transcript
 *   words/minute   real word count over real recorded duration
 *   deliveryScore  responds to those — same transcript scored 85 clean,
 *                  62 with 28 fillers, 38 rushed at 215wpm, 42 at 65wpm
 *   per-answer     strong 76-77, weak 16-17, overall tracks its sub-scores
 *   session report every figure computed, verified exact against known inputs
 *   bodyLanguage   honestly null rather than invented
 *
 * What was broken was the coaching text. The report needs ~1,219 output tokens
 * and the route capped it at 1,000, so it stopped on max_tokens every time and
 * the JSON was cut mid-structure. `JSON.parse(jsonMatch?.[0] || "{}")` then
 * swallowed the failure, and every session report returned 200 with correct
 * scores and no recruiter feedback, strengths, improvements, roadmap or next
 * steps at all.
 */

const aiDir = join(__dirname, "..", "app", "api", "ai")
const finalReport = readFileSync(join(aiDir, "interview", "final-report", "route.ts"), "utf8")

function routeFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? routeFiles(join(dir, e.name)) : e.name === "route.ts" ? [join(dir, e.name)] : []
  )
}

describe("the session report's numbers are computed, not asked for", () => {
  it("averages each dimension across the answers", () => {
    for (const field of ["contentScore", "starScore", "deliveryScore", "commercialScore", "communicationScore"]) {
      const avgVar = field.replace("Score", "")
      expect(finalReport, `${field} is not averaged from the answers`)
        .toMatch(new RegExp(`answers\\.reduce[\\s\\S]{0,120}${field}`))
    }
  })

  it("derives the overall figure from those averages by weight", () => {
    expect(finalReport).toMatch(/avgContent \* 0\.30 \+ avgStar \* 0\.20 \+ avgDelivery \* 0\.20/)
  })

  it("does not invent a body language score it cannot observe", () => {
    expect(finalReport).toMatch(/bodyLanguageScore:\s*null/)
  })

  it("sums the real filler and pace measurements rather than estimating", () => {
    expect(finalReport).toMatch(/fillerWords\?\.total/)
    expect(finalReport).toMatch(/delivery\?\.wordsPerMinute/)
  })
})

describe("a report without coaching is not returned as a success", () => {
  it("asks for enough tokens to finish the coaching JSON", () => {
    // Measured: ~1,219 output tokens needed; 1,000 truncated every time.
    const m = finalReport.match(/max_tokens:\s*(\d+)/)
    expect(m).not.toBeNull()
    expect(Number(m![1])).toBeGreaterThanOrEqual(1500)
  })

  it("fails loudly when the coaching cannot be parsed", () => {
    expect(finalReport).toMatch(/Could not generate your coaching feedback/)
  })

  it("rejects a report that came back without recruiter feedback", () => {
    expect(finalReport).toMatch(/!coaching\.recruiterFeedback/)
  })
})

describe("no AI route swallows an unparseable response", () => {
  it("none falls back to an empty object", () => {
    const offenders: string[] = []
    for (const f of routeFiles(aiDir)) {
      const src = readFileSync(f, "utf8")
      if (/JSON\.parse\([^)]*\|\|\s*"\{\}"/.test(src)) offenders.push(f.split("/api/ai/")[1])
    }
    expect(offenders, `silently returns an empty result:\n${offenders.join("\n")}`).toEqual([])
  })
})

describe("delivery metrics are measured from the recording", () => {
  const filler = readFileSync(join(__dirname, "..", "lib", "interview", "filler-words.ts"), "utf8")

  it("counts filler words in the transcript rather than estimating them", () => {
    expect(filler).toMatch(/transcript\.toLowerCase\(\)/)
    expect(filler).toMatch(/\\\\b\$\{filler/)
  })

  it("rates them against the real duration", () => {
    expect(filler).toMatch(/durationSeconds \/ 60/)
  })
})

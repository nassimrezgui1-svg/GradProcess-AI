import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

/**
 * Measured latency against the 60s Vercel function ceiling:
 *
 *   breakdown      4096 tokens, all 14 sections   65.7s  — failed every time
 *   psychometric   8000 tokens, 20 questions      >60s   — 0 of 3 attempts worked
 *   generate-star  4096 tokens, 4 spoken versions 45-50s — raced its 45s client
 *                                                          timeout, failing ~half
 *
 * A single call asking for more than ~2,600 tokens does not reliably finish.
 * Large jobs are split into concurrent parts instead, so wall-clock time is the
 * slowest part rather than the sum.
 */

const aiDir = join(__dirname, "..", "app", "api", "ai")
const MAX_SINGLE_CALL_TOKENS = 2600

function routeFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? routeFiles(join(dir, e.name)) : e.name === "route.ts" ? [join(dir, e.name)] : []
  )
}

describe("no AI route asks for more than one request can deliver in time", () => {
  it("every max_tokens sits inside the measured budget", () => {
    const offenders: string[] = []
    for (const f of routeFiles(aiDir)) {
      const src = readFileSync(f, "utf8")
      for (const m of src.matchAll(/max_tokens:\s*(\d+)/g)) {
        const tokens = Number(m[1])
        if (tokens > MAX_SINGLE_CALL_TOKENS) {
          offenders.push(`${f.split("/api/ai/")[1]}: max_tokens ${tokens}`)
        }
      }
    }
    expect(offenders, `over the ${MAX_SINGLE_CALL_TOKENS}-token budget:\n${offenders.join("\n")}`).toEqual([])
  })

  it("the three routes that timed out now split their work concurrently", () => {
    for (const rel of ["tracker/breakdown", "psychometric-quiz", "generate-star"]) {
      const src = readFileSync(join(aiDir, ...rel.split("/"), "route.ts"), "utf8")
      expect(src, `${rel} does not run its parts concurrently`).toMatch(/Promise\.all|Promise\.allSettled/)
    }
  })

  it("a psychometric test never comes back empty with a success status", () => {
    // Returning { questions: [] } with 200 showed a test containing nothing.
    const src = readFileSync(join(aiDir, "psychometric-quiz", "route.ts"), "utf8")
    expect(src).toMatch(/merged\.length === 0/)
    expect(src).toMatch(/status: 502/)
  })
})

describe("a failed generation is always visible to the user", () => {
  const pages = [
    ["star-builder", join(__dirname, "..", "app", "(app)", "star-builder", "page.tsx")],
    ["video-interview", join(__dirname, "..", "app", "(app)", "video-interview", "page.tsx")],
    ["industry-hub", join(__dirname, "..", "app", "(app)", "industry-hub", "page.tsx")],
    ["cv-tailoring", join(__dirname, "..", "app", "(app)", "cv-tailoring", "page.tsx")],
  ] as const

  for (const [name, path] of pages) {
    it(`${name} renders the error it catches`, () => {
      const src = readFileSync(path, "utf8")
      const setter = src.match(/set(\w*Error)\(/)
      expect(setter, `${name} never sets an error`).not.toBeNull()
      const stateName = setter![1].charAt(0).toLowerCase() + setter![1].slice(1)
      // The state must be read somewhere in JSX, not just written.
      const reads = new RegExp(`\\{${stateName}\\s*&&|\\{${stateName}\\}`).test(src)
      expect(reads, `${name} sets ${stateName} but never displays it`).toBe(true)
    })
  }
})

/**
 * CV Tailoring seeds its result state with a sample analysis and hides the
 * "Demo mode" banner only on success. With try/finally and no catch, a failed
 * analysis left that sample on screen: the spinner stopped, the banner still
 * said Demo mode, and the 68/100 sample score and sample keywords sat there
 * looking like the user's own result. Reported as "it says analysing but
 * doesn't show any changes or an accurate score".
 */
describe("a failed CV analysis never passes the sample off as a result", () => {
  const page = readFileSync(
    join(__dirname, "..", "app", "(app)", "cv-tailoring", "page.tsx"), "utf8")

  it("catches the failure rather than only clearing the spinner", () => {
    const handler = page.slice(page.indexOf("const handleAnalyse"))
    const body = handler.slice(0, handler.indexOf("const handleCopySummary"))
    expect(body).toMatch(/\} catch/)
    expect(body).toMatch(/setAnalysisError/)
  })

  it("says the visible scores are not the user's when it fails", () => {
    expect(page).toMatch(/not yours/)
    expect(page).toMatch(/analysisError &&/)
  })

  it("does not show the demo banner and an error at the same time", () => {
    expect(page).toMatch(/showDemo && !analysisError/)
  })
})

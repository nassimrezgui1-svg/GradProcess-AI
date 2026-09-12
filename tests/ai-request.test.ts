import { describe, it, expect, vi, afterEach } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { postAI, AiRequestError, AI_TIMEOUT_MS } from "@/lib/ai/request"

/**
 * AI calls had no timeout on either side. A September 2026 audit recorded
 * requests held open for 41s and 113s, and STAR generation and psychometric
 * question generation that never resolved at all — the button simply span
 * forever with no error and no way back.
 */

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })

describe("postAI", () => {
  it("returns the parsed body on success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ questions: [1, 2] }),
    }))
    await expect(postAI("/api/ai/x", {})).resolves.toEqual({ questions: [1, 2] })
  })

  it("aborts rather than hanging, and says so", async () => {
    // Mimics fetch rejecting because its AbortSignal fired.
    vi.stubGlobal("fetch", vi.fn().mockImplementation((_u: string, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener("abort", () => {
          const e = new Error("aborted"); e.name = "AbortError"; reject(e)
        })
      })
    ))
    const promise = postAI("/api/ai/slow", {}, { timeoutMs: 10 })
    await expect(promise).rejects.toBeInstanceOf(AiRequestError)
    await expect(promise).rejects.toMatchObject({ kind: "timeout" })
  })

  it("surfaces the server's own error message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false, status: 503, json: async () => ({ error: "Payments are not configured yet." }),
    }))
    await expect(postAI("/api/ai/x", {})).rejects.toThrow("Payments are not configured yet.")
  })

  it("falls back to a readable message when the server sends none", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false, status: 500, json: async () => { throw new Error("no body") },
    }))
    await expect(postAI("/api/ai/x", {})).rejects.toThrow(/Request failed \(500\)/)
  })

  it("reports a network failure distinctly from a timeout", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")))
    await expect(postAI("/api/ai/x", {})).rejects.toMatchObject({ kind: "network" })
  })

  it("uses a ceiling long enough for a real generation but not unbounded", () => {
    // Answer analysis legitimately took ~25s in the audit.
    expect(AI_TIMEOUT_MS).toBeGreaterThanOrEqual(30_000)
    expect(AI_TIMEOUT_MS).toBeLessThanOrEqual(60_000)
  })
})

describe("server-side limits", () => {
  const aiDir = join(__dirname, "..", "app", "api", "ai")

  function routeFiles(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap(e =>
      e.isDirectory() ? routeFiles(join(dir, e.name)) : e.name === "route.ts" ? [join(dir, e.name)] : []
    )
  }

  it("every AI route caps its own duration", () => {
    const files = routeFiles(aiDir)
    expect(files.length).toBeGreaterThan(5)
    for (const f of files) {
      expect(readFileSync(f, "utf8"), `${f} has no maxDuration`).toMatch(/export const maxDuration\s*=\s*\d+/)
    }
  })

  it("no AI call site bypasses the timeout helper with a bare fetch", () => {
    const service = readFileSync(join(__dirname, "..", "lib", "ai", "service.ts"), "utf8")
    expect(service).toContain("postAI")
    expect(service).not.toMatch(/await fetch\(/)
  })
})

/**
 * The original version of this file only checked lib/ai/service.ts, so seven
 * page-level call sites kept their own bare fetch and none of them were
 * covered. The AI Breakdown tab was one: it had no timeout and called
 * res.json() before checking res.ok, so when the function timed out and Vercel
 * returned a plain-text 504, the user saw
 *
 *   Unexpected token 'A', "An error o"... is not valid JSON
 *
 * instead of anything actionable.
 */
describe("no page calls an AI endpoint without the helper", () => {
  function tsxFiles(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap(e => {
      if (e.name === "node_modules" || e.name.startsWith(".")) return []
      const p = join(dir, e.name)
      return e.isDirectory() ? tsxFiles(p) : /\.tsx?$/.test(e.name) ? [join(dir, e.name)] : []
    })
  }

  const root = join(__dirname, "..")
  const sources = [...tsxFiles(join(root, "app")), ...tsxFiles(join(root, "components"))]
    .filter(f => !f.includes(`${"app"}/api/`))

  it("every /api/ai call goes through postAI", () => {
    const offenders: string[] = []
    for (const f of sources) {
      const src = readFileSync(f, "utf8")
      for (const m of src.matchAll(/fetch\(\s*["'`]\/api\/ai\//g)) {
        const line = src.slice(0, m.index).split("\n").length
        offenders.push(`${f.replace(root + "/", "")}:${line}`)
      }
    }
    expect(offenders, `bare fetch to an AI endpoint (no timeout, no error handling):\n${offenders.join("\n")}`).toEqual([])
  })

  it("a failed AI call is surfaced rather than swallowed", () => {
    // try/finally with no catch stopped the spinner and showed nothing.
    for (const name of ["video-interview", "industry-hub"]) {
      const f = sources.find(s => s.includes(`${name}/page.tsx`))!
      const src = readFileSync(f, "utf8")
      const awaits = (src.match(/await postAI/g) || []).length
      const catches = (src.match(/\} catch/g) || []).length
      expect(catches, `${name} has ${awaits} postAI calls but only ${catches} catch blocks`).toBeGreaterThanOrEqual(awaits)
    }
  })
})

/**
 * One request for all fourteen sections measured 65.7s for 3,114 output
 * tokens, past the 60s function ceiling, so it failed every time. Split in
 * two concurrent halves it measured 36.2s.
 */
describe("the tracker breakdown fits inside the function ceiling", () => {
  const route = readFileSync(
    join(__dirname, "..", "app", "api", "ai", "tracker", "breakdown", "route.ts"), "utf8")

  it("issues its parts concurrently rather than in sequence", () => {
    expect(route).toMatch(/Promise\.all/)
  })

  it("keeps every part small enough that the slowest one still fits", () => {
    // One 4096-token call took 65.7s. Two parts measured 45-48s on Vercel —
    // only ~12s of headroom — so the work is split three ways.
    const budgets = [...route.matchAll(/generateSection\([A-Z_]+, context, (\d+)\)/g)].map(m => +m[1])
    expect(budgets.length).toBeGreaterThanOrEqual(3)
    for (const b of budgets) expect(b).toBeLessThanOrEqual(1800)
  })

  it("still returns every field the UI reads", () => {
    for (const field of ["roleSummary", "companyOverview", "interviewQuestions",
                         "starSuggestions", "prepRoadmap", "readinessScore",
                         "atsRecommendations", "assessmentCentreExpectations"]) {
      expect(route, `breakdown no longer produces ${field}`).toContain(field)
    }
  })
})

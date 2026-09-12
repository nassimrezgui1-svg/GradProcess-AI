import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

/**
 * Audit of every score the product shows, after the ATS score turned out to be
 * a number the model invented rather than derived.
 *
 * Measured, same job spec / same inputs, two runs each:
 *
 *   psychometric   computed as correct/total          genuine
 *   STAR           strong 82/82, weak 18/12           genuine, discriminates
 *   interview      overall 76 vs mean-of-subs 76;     genuine, tracks its parts
 *                  strong 76-77, weak 16-17
 *   ATS            strong 62, middling 62             FIXED — now derived
 *   tracker        Barclays 52 and 52, McKinsey 42,   REMOVED — varied by role,
 *                  Greggs 48, always within 40-65     never by applicant
 *
 * The tracker figure was generated from company, role, sector and job
 * description only. No user data reached that route, so every applicant to the
 * same job saw the same "Application Readiness" presented as their own.
 */

const root = join(__dirname, "..")
const aiDir = join(root, "app", "api", "ai")

function routeFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? routeFiles(join(dir, e.name)) : e.name === "route.ts" ? [join(dir, e.name)] : []
  )
}

describe("no score is invented from inputs that cannot support it", () => {
  it("the tracker breakdown no longer produces a readiness figure", () => {
    const route = readFileSync(join(aiDir, "tracker", "breakdown", "route.ts"), "utf8")
    expect(route).not.toMatch(/"readinessScore"\s*:/)
  })

  it("nothing stores a role-derived readiness on an application", () => {
    const store = readFileSync(join(root, "lib", "tracker", "store.ts"), "utf8")
    expect(store).not.toMatch(/readinessScore:\s*breakdown\.readinessScore/)
  })

  it("the tracker shows readiness measured from the user's own modules", () => {
    const page = readFileSync(join(root, "app", "(app)", "tracker", "[id]", "page.tsx"), "utf8")
    expect(page).toMatch(/loadDashboardScores\(\)\.overall/)
    // and says where the number comes from
    expect(page).toMatch(/from your completed modules/)
  })

  it("says so plainly when there is nothing to measure yet", () => {
    const page = readFileSync(join(root, "app", "(app)", "tracker", "[id]", "page.tsx"), "utf8")
    expect(page).toMatch(/Complete a CV analysis, STAR answer, interview or psychometric test/)
  })
})

describe("scores that are genuine stay that way", () => {
  it("psychometric is computed from answers, not asked for", () => {
    const page = readFileSync(join(root, "app", "(app)", "psychometric", "page.tsx"), "utf8")
    expect(page).toMatch(/filter\(a => a\.isCorrect\)\.length \/ newAnswers\.length/)
  })

  it("the ATS headline is computed, not taken from the model", () => {
    const route = readFileSync(join(aiDir, "analyse-cv", "route.ts"), "utf8")
    expect(route).toMatch(/computeOverallScore/)
  })

  it("every remaining model-supplied score has real user input to judge", () => {
    // A score is only legitimate if the route is given the user's own work.
    const scored = routeFiles(aiDir).filter(f => /"(overall)?[sS]core"\s*:/.test(readFileSync(f, "utf8")))
    for (const f of scored) {
      const src = readFileSync(f, "utf8")
      const takesUserWork = /(transcript|cv|answers|experience)/i.test(
        src.slice(0, src.indexOf("await req.json()") + 200)
      )
      expect(takesUserWork, `${f.split("/api/ai/")[1]} scores without receiving the user's work`).toBe(true)
    }
  })
})

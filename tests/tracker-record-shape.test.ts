import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * Opening a tracked role killed the browser tab: "This page couldn't load",
 * Chrome's own screen rather than an error boundary.
 *
 *   TypeError: Cannot read properties of undefined (reading 'length')
 *   app/(app)/tracker/[id]/page.tsx (135:21) @ OverviewTab
 *   > 135 |  (app.skills.length > 0 && (
 *
 * TrackerApp types skills, softSkills, responsibilities, requirements,
 * stageHistory and interviewDates as arrays that are always present, but
 * nothing guaranteed a stored record had them — entries saved before those
 * fields existed, and ones added by hand, do not. Five separate reads in the
 * page had the same exposure.
 */

const root = join(__dirname, "..")
const store = readFileSync(join(root, "lib", "tracker", "store.ts"), "utf8")
const page = readFileSync(join(root, "app", "(app)", "tracker", "[id]", "page.tsx"), "utf8")

/** Mirrors normalise() in the store. */
function normalise(app: any) {
  return {
    ...app,
    skills: Array.isArray(app?.skills) ? app.skills : [],
    softSkills: Array.isArray(app?.softSkills) ? app.softSkills : [],
    responsibilities: Array.isArray(app?.responsibilities) ? app.responsibilities : [],
    requirements: Array.isArray(app?.requirements) ? app.requirements : [],
    stageHistory: Array.isArray(app?.stageHistory) ? app.stageHistory : [],
    interviewDates: Array.isArray(app?.interviewDates) ? app.interviewDates : [],
  }
}

const LIST_FIELDS = [
  "skills", "softSkills", "responsibilities",
  "requirements", "stageHistory", "interviewDates",
] as const

describe("a stored role always comes back with the shape the page expects", () => {
  it("fills in every list field on a bare record", () => {
    const bare = { id: "a", company: "Barclays", role: "Graduate Analyst", stage: "applied" }
    const app = normalise(bare)
    for (const f of LIST_FIELDS) {
      expect(Array.isArray(app[f]), `${f} is not an array`).toBe(true)
      expect(app[f]).toEqual([])
    }
  })

  it("reading .length on any list field cannot throw", () => {
    const app = normalise({ id: "a" })
    for (const f of LIST_FIELDS) {
      expect(() => app[f].length).not.toThrow()
    }
  })

  it("leaves real data alone", () => {
    const app = normalise({ id: "a", skills: ["Excel", "SQL"], requirements: ["2:1"] })
    expect(app.skills).toEqual(["Excel", "SQL"])
    expect(app.requirements).toEqual(["2:1"])
    expect(app.softSkills).toEqual([])
  })

  it("replaces a wrong type rather than trusting it", () => {
    const app = normalise({ id: "a", skills: "Excel, SQL", stageHistory: null })
    expect(app.skills).toEqual([])
    expect(app.stageHistory).toEqual([])
  })

  it("normalises on both read paths, not just one", () => {
    expect(store).toMatch(/loadApps\(\)[\s\S]{0,80}\.map\(normalise\)/)
    expect(store).toMatch(/getApp[\s\S]{0,140}normalise\(found\)/)
  })

  it("the page still reads these fields directly, which is why the store guarantees them", () => {
    expect(page).toMatch(/app\.skills\.length/)
  })
})

/**
 * My own regression. Rendering the breakdown in three parts meant the first
 * part to land was saved on its own — a breakdown holding the profile and
 * nothing else. The tabs read b.likelyInterviewStages.length,
 * b.interviewQuestions.map, b.prepRoadmap.length and b.starSuggestions.map
 * directly, so AI Breakdown, Interview Prep and STAR Stories all crashed, and
 * the partial record persisted so they stayed crashed on reload.
 */
const BREAKDOWN_LISTS = [
  "keyResponsibilities", "keySkills", "competencies", "technicalAreas",
  "commercialThemes", "interviewQuestions", "starSuggestions", "prepRoadmap",
  "gapAnalysis", "atsRecommendations", "likelyInterviewStages",
  "assessmentCentreExpectations",
] as const

function normaliseBreakdown(b: any) {
  const list = (v: unknown) => (Array.isArray(v) ? v : [])
  return { ...b, ...Object.fromEntries(BREAKDOWN_LISTS.map(k => [k, list(b?.[k])])) }
}

describe("a half-finished breakdown does not break the tabs", () => {
  it("a profile-only breakdown still has every list the tabs read", () => {
    const partial = { roleSummary: "…", companyOverview: "…", keySkills: ["Excel"] }
    const b = normaliseBreakdown(partial)
    for (const f of BREAKDOWN_LISTS) {
      expect(Array.isArray(b[f]), `${f} is not an array`).toBe(true)
      expect(() => b[f].length).not.toThrow()
    }
    expect(b.keySkills).toEqual(["Excel"])
  })

  it("the store repairs breakdowns already saved in a partial state", () => {
    expect(store).toMatch(/normaliseBreakdown/)
    expect(store).toMatch(/breakdown: app\?\.breakdown \? normaliseBreakdown/)
  })

  it("generation starts from a complete shape rather than an empty object", () => {
    // Otherwise the first part to arrive is saved without the other lists.
    expect(page).toMatch(/emptyBreakdown/)
    expect(page).toMatch(/\.\.\.emptyBreakdown\(\)/)
  })
})

/**
 * Found by opening every page I had changed, rather than by a test.
 *
 * Psychometric printed "Across 1 test · NaN total questions answered" — a
 * stored session missing a field turned every reduce into NaN and the page
 * rendered it. Billing sat on a spinner for ever: the effect returned early
 * when there was no session without clearing the loading flag, and nothing
 * caught a failed query.
 */
describe("aggregates and loading states cannot get stuck", () => {
  const psych = readFileSync(join(root, "app", "(app)", "psychometric", "page.tsx"), "utf8")
  const billing = readFileSync(join(root, "app", "(app)", "billing", "page.tsx"), "utf8")

  function sumBy<T>(rows: T[], pick: (r: T) => unknown): number {
    return rows.reduce((sum, r) => {
      const v = pick(r)
      return sum + (typeof v === "number" && Number.isFinite(v) ? v : 0)
    }, 0)
  }

  it("a session missing a field sums to a number, not NaN", () => {
    const sessions = [{ total: 20 }, {}, { total: undefined }, { total: NaN }] as any[]
    const total = sumBy(sessions, s => s.total)
    expect(Number.isNaN(total)).toBe(false)
    expect(total).toBe(20)
  })

  it("psychometric no longer reduces over raw fields", () => {
    expect(psych).not.toMatch(/reduce\(\(s, t\) => s \+ t\.total, 0\)/)
    expect(psych).toMatch(/sumBy\(testLog/)
  })

  it("billing clears its spinner on every path", () => {
    expect(billing).toMatch(/finally \{[\s\S]{0,80}setLoading\(false\)/)
    expect(billing).toMatch(/catch \{/)
    expect(billing).toMatch(/loadError/)
  })
})

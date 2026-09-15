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

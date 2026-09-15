import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * Reported after a real sitting:
 *   - a question asking for two answers could not be answered, because the
 *     model held one index and the first click submitted immediately
 *   - leaving mid-test discarded everything with no warning
 *   - abstract reasoning was described in words, when the whole point of that
 *     test is that it is visual
 */

const root = join(__dirname, "..")
const page = readFileSync(join(root, "app", "(app)", "psychometric", "page.tsx"), "utf8")
const route = readFileSync(join(root, "app", "api", "ai", "psychometric-quiz", "route.ts"), "utf8")

/** Mirrors the page: correct only when every right option is picked and nothing else. */
function isCorrect(picked: number[], answer: number[]) {
  return picked.length === answer.length && picked.every(i => answer.includes(i))
}

describe("a question may ask for more than one answer", () => {
  it("marks a two-answer question right only when both are picked", () => {
    expect(isCorrect([0, 3], [0, 3])).toBe(true)
    expect(isCorrect([3, 0], [0, 3])).toBe(true)  // order should not matter
    expect(isCorrect([0], [0, 3])).toBe(false)     // half an answer is not right
    expect(isCorrect([0, 1], [0, 3])).toBe(false)
    expect(isCorrect([0, 1, 3], [0, 3])).toBe(false)
  })

  it("still handles ordinary single-answer questions", () => {
    expect(isCorrect([2], [2])).toBe(true)
    expect(isCorrect([1], [2])).toBe(false)
    expect(isCorrect([], [2])).toBe(false)   // timed out
  })

  it("the page tracks a list of picks, not one index", () => {
    expect(page).toMatch(/useState<number\[\]>\(\[\]\)/)
    expect(page).toMatch(/requiredFor/)
    // and does not submit on the first click when two are needed
    expect(page).toMatch(/if \(next\.length === required\) submitAnswer/)
  })

  it("tells the candidate how many to choose", () => {
    expect(page).toMatch(/Select \{requiredFor\(currentQ\)\} answers/)
  })

  it("the route can express a two-answer question", () => {
    expect(route).toMatch(/selectCount/)
    expect(route).toMatch(/Array\.isArray\(q\.correct\)/)
  })
})

describe("a test in progress is not silently thrown away", () => {
  it("warns before the tab is closed", () => {
    expect(page).toMatch(/beforeunload/)
  })

  it("warns before navigating away inside the app", () => {
    // The router does not fire beforeunload, and the sidebar is the likelier exit.
    expect(page).toMatch(/document\.addEventListener\("click", intercept, true\)/)
    expect(page).toMatch(/Leave anyway\?/)
  })
})

describe("abstract reasoning is drawn, not described", () => {
  it("asks for shape data rather than prose", () => {
    expect(route).toMatch(/"sequence"/)
    expect(route).toMatch(/"optionShapes"/)
    expect(route).not.toMatch(/describe the pattern in words/)
  })

  it("renders the figures", () => {
    expect(page).toMatch(/ShapeSequence/)
    expect(page).toMatch(/ShapeFigure/)
  })

  it("does not collapse a whole set into one question", () => {
    // Every abstract stem is the same sentence, so the figures have to count
    // towards identity or dedupe removes all but one.
    expect(route).toMatch(/q\?\.sequence \? JSON\.stringify\(q\.sequence\)/)
  })
})

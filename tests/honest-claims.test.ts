import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

/**
 * The product is entirely behind a subscription, and there is no pool of other
 * applicants to compare a user against. Several surfaces claimed otherwise.
 *
 *   pricing page   "Score benchmarking vs graduate applicant pool"
 *   features page  "Percentile estimates vs graduate applicant pool"
 *   psychometric   a "Percentile est." tile computed as score * 0.9 + 5 —
 *                  the user's own score relabelled as a rank, shown to
 *                  paying customers as though it were a comparison
 *   sign-up page   "Start your free readiness assessment today"
 *   login page     "Create one free"
 */

const root = join(__dirname, "..")

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    if (e.name === "node_modules" || e.name.startsWith(".")) return []
    const p = join(dir, e.name)
    return e.isDirectory() ? sourceFiles(p) : /\.tsx?$/.test(e.name) ? [p] : []
  })
}

const files = [...sourceFiles(join(root, "app")), ...sourceFiles(join(root, "components"))]
// Comments explain what was removed and why; only live code should be checked.
const stripComments = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")

describe("no surface claims a comparison against other applicants", () => {
  it("nothing offers benchmarking or percentiles against an applicant pool", () => {
    const hits: string[] = []
    for (const f of files) {
      const src = stripComments(readFileSync(f, "utf8"))
      if (/benchmark/i.test(src) || /percentile/i.test(src) || /applicant pool/i.test(src)) {
        hits.push(f.replace(root + "/", ""))
      }
    }
    expect(hits, `still claims a comparison we cannot make:\n${hits.join("\n")}`).toEqual([])
  })
})

describe("no surface promises a free tier", () => {
  it("does not offer free access the paywall blocks", () => {
    const hits: string[] = []
    for (const f of files) {
      const src = stripComments(readFileSync(f, "utf8"))
      for (const m of src.matchAll(/(?:create one free|free readiness|free trial|start free|free assessment)/gi)) {
        hits.push(`${f.replace(root + "/", "")}: "${m[0]}"`)
      }
    }
    expect(hits, `promises free access:\n${hits.join("\n")}`).toEqual([])
  })
})

describe("a disabled primary button still reads as a button", () => {
  it("is not faded to the point of looking broken", () => {
    const css = readFileSync(join(root, "app", "globals.css"), "utf8")
    const m = css.match(/\.btn-gradient:disabled\s*\{[^}]*opacity:\s*([\d.]+)/)
    expect(m, "no disabled rule for .btn-gradient").not.toBeNull()
    expect(parseFloat(m![1])).toBeGreaterThanOrEqual(0.55)
  })
})

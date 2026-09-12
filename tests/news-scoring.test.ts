import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * The Consulting feed was permanently empty while every other sector worked.
 *
 * Cause: scoring used `text.includes(keyword)`, so the Consulting keyword "ey"
 * (the firm) matched "they", "money", "key" and "survey". Virtually every
 * article in every feed scored exactly 1 on irrelevant text, while genuinely
 * relevant articles rarely cleared the `score >= 2` cutoff — so the cutoff
 * removed the real news and left the noise sitting just underneath it.
 *
 * The page meanwhile printed "Sourced from BBC, Financial Times, Guardian,
 * City A.M., CNBC, Economist" over that empty state: a confident, specific
 * claim contradicted by the screen.
 */

const root = join(__dirname, "..")
const route = readFileSync(join(root, "app", "api", "news", "route.ts"), "utf8")
const hub = readFileSync(join(root, "app", "(app)", "industry-hub", "page.tsx"), "utf8")

/** The route's own matcher, mirrored so the rule itself is under test. */
function matches(keyword: string, text: string): boolean {
  const escaped = keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, "u").test(text.toLowerCase())
}

describe("keyword matching respects word boundaries", () => {
  it("does not match a short firm name inside ordinary words", () => {
    for (const text of ["They said money is key", "A survey of the whole key market", "Whiskey and honey"]) {
      expect(matches("ey", text), `"ey" wrongly matched: ${text}`).toBe(false)
    }
  })

  it("still matches the firm when it stands alone", () => {
    expect(matches("ey", "EY reports record UK revenue")).toBe(true)
    expect(matches("ey", "Audit reform hits EY, KPMG and PwC")).toBe(true)
  })

  it("matches other short, collision-prone tickers correctly", () => {
    expect(matches("bp", "BP cuts renewables spending")).toBe(true)
    expect(matches("bp", "A 50bp rate rise")).toBe(false)
    expect(matches("ev", "EV sales climb")).toBe(true)
    expect(matches("ev", "Every evening the revenue fell")).toBe(false)
  })

  it("matches multi-word phrases", () => {
    expect(matches("post-merger integration", "Advisers bill for post-merger integration work")).toBe(true)
  })
})

describe("the news route uses boundary-aware scoring", () => {
  it("no longer scores articles with a bare includes()", () => {
    expect(route).not.toMatch(/text\.includes\(kw\.toLowerCase\(\)\)/)
    expect(route).toContain("keywordPattern")
  })

  it("weights named firms and phrases above single generic nouns", () => {
    expect(route).toMatch(/NAMED_ENTITIES/)
    expect(route).toMatch(/strong \? 2 : 1/)
  })

  it("keeps a relevance cutoff rather than padding the feed with anything", () => {
    // Filling an empty sector with unrelated articles is worse than an empty
    // state: it presents oil-pipeline and cosmetics-lawsuit stories as
    // consulting news.
    expect(route).toMatch(/if \(score < 1\) continue/)
  })
})

describe("the page does not claim sources it did not use", () => {
  it("never hardcodes the six-outlet sourcing line", () => {
    expect(hub).not.toContain("Sourced from BBC, Financial Times, Guardian, City A.M., CNBC, Economist")
  })

  it("names the outlets that actually returned articles", () => {
    expect(hub).toMatch(/Sourced from \$\{allSources\.filter/)
  })
})

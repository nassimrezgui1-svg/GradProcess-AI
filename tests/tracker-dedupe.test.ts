import { describe, it, expect } from "vitest"
import { dedupe } from "@/lib/tracker/store"
import type { TrackerApp } from "@/lib/tracker/types"

/**
 * The UX audit found "Securities Lending Trader" at BlackRock listed twice,
 * identically, in the Saved column. Cause: rows predating the client_id column
 * sync back under the database UUID, so the same application can be written a
 * second time.
 */

const app = (over: Partial<TrackerApp>): TrackerApp => ({
  id: "a1",
  company: "BlackRock",
  role: "Securities Lending Trader",
  sector: "Asset Management",
  stage: "saved",
  notes: "",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...over,
} as TrackerApp)

describe("dedupe", () => {
  it("keeps a single application untouched", () => {
    expect(dedupe([app({})])).toHaveLength(1)
  })

  it("collapses the same application arriving under two different ids", () => {
    const out = dedupe([app({ id: "client-1" }), app({ id: "db-uuid-1" })])
    expect(out).toHaveLength(1)
    expect(out[0].id).toBe("client-1") // first wins, preserving order
  })

  it("removes exact duplicate ids", () => {
    expect(dedupe([app({ id: "same" }), app({ id: "same" })])).toHaveLength(1)
  })

  it("keeps genuinely different applications at the same company", () => {
    const out = dedupe([
      app({ id: "1", role: "Securities Lending Trader" }),
      app({ id: "2", role: "Equity Research Analyst" }),
    ])
    expect(out).toHaveLength(2)
  })

  it("keeps the same role at different companies", () => {
    const out = dedupe([app({ id: "1" }), app({ id: "2", company: "Fidelity" })])
    expect(out).toHaveLength(2)
  })

  it("treats a moved application as distinct from one still saved", () => {
    const out = dedupe([app({ id: "1", stage: "saved" }), app({ id: "2", stage: "applied" })])
    expect(out).toHaveLength(2)
  })

  it("ignores case and padding when comparing", () => {
    const out = dedupe([app({ id: "1" }), app({ id: "2", company: "  blackrock ", role: "SECURITIES LENDING TRADER" })])
    expect(out).toHaveLength(1)
  })

  it("handles an empty list", () => {
    expect(dedupe([])).toEqual([])
  })
})

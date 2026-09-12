import { describe, it, expect } from "vitest"
import { STAGES, PIPELINE_STAGES, TERMINAL_STAGES, getStage } from "@/lib/tracker/types"
import type { Stage } from "@/lib/tracker/types"

/**
 * The Kanban stats bar disagreed with the board beneath it, in two ways.
 *
 * 1. "Active / Interviews / Offers" counted the unfiltered application list
 *    while the columns rendered the sector-filtered one, so choosing a sector
 *    left the totals describing a different set than was on screen.
 *
 * 2. getStage() resolves an unknown stage id to STAGES[0] ("saved"), which is
 *    non-terminal — so an application with a legacy or malformed stage counted
 *    towards Active while matching no column's `a.stage === s.id`. It rendered
 *    nowhere, and the board totalled one fewer than the bar.
 */

type App = { id: string; sector: string; stage: Stage }

/** Mirrors the page: filter, then normalise, then split into columns. */
function board(apps: App[], sectorFilter: string) {
  const filtered = sectorFilter === "All" ? apps : apps.filter(a => a.sector === sectorFilter)
  const normalised = filtered.map(a =>
    STAGES.some(s => s.id === a.stage) ? a : { ...a, stage: "saved" as Stage }
  )
  const INTERVIEW_STAGES = ["video_interview", "first_interview", "assessment_centre", "final_interview"]
  return {
    normalised,
    columns: [...PIPELINE_STAGES, ...TERMINAL_STAGES].map(s => normalised.filter(a => a.stage === s.id)),
    stats: {
      active: normalised.filter(a => !getStage(a.stage).terminal).length,
      interviews: normalised.filter(a => INTERVIEW_STAGES.includes(a.stage)).length,
      offers: normalised.filter(a => a.stage === "offer").length,
    },
  }
}

const apps: App[] = [
  { id: "1", sector: "Banking", stage: "applied" },
  { id: "2", sector: "Banking", stage: "first_interview" },
  { id: "3", sector: "Law", stage: "offer" },
  { id: "4", sector: "Law", stage: "rejected" },
  { id: "5", sector: "Banking", stage: "legacy_stage" as Stage }, // not a known id
]

describe("every application appears in exactly one column", () => {
  for (const filter of ["All", "Banking", "Law"]) {
    it(`holds for the "${filter}" filter`, () => {
      const { normalised, columns } = board(apps, filter)
      const placed = columns.reduce((n, c) => n + c.length, 0)
      expect(placed).toBe(normalised.length)
      // and no application is counted twice
      const ids = columns.flat().map(a => a.id)
      expect(new Set(ids).size).toBe(ids.length)
    })
  }

  it("places an unknown stage rather than dropping it", () => {
    const { columns } = board([{ id: "x", sector: "Banking", stage: "nonsense" as Stage }], "All")
    expect(columns.reduce((n, c) => n + c.length, 0)).toBe(1)
  })
})

describe("the stats bar agrees with the board", () => {
  it("counts only what the filter shows", () => {
    const all = board(apps, "All")
    const banking = board(apps, "Banking")
    expect(all.stats.offers).toBe(1)
    // The Law offer must not be counted while Banking is selected.
    expect(banking.stats.offers).toBe(0)
    expect(banking.normalised.length).toBe(3)
  })

  it("Active never exceeds what the pipeline columns render", () => {
    for (const filter of ["All", "Banking", "Law"]) {
      const { normalised, stats } = board(apps, filter)
      const inPipeline = PIPELINE_STAGES.reduce(
        (n, s) => n + normalised.filter(a => a.stage === s.id).length, 0)
      expect(stats.active, `Active disagrees with the board for "${filter}"`).toBe(inPipeline)
    }
  })

  it("counts video interviews as interviews", () => {
    const { stats } = board([{ id: "v", sector: "Tech", stage: "video_interview" }], "All")
    expect(stats.interviews).toBe(1)
  })
})

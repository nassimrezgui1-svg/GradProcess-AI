import { describe, it, expect } from "vitest"
import { parseInline, parseMarkdown } from "@/lib/markdown"

/**
 * Ava's replies are Markdown. They used to render literally — the UX audit
 * found "**My recommendation:**" and "*leadership*" showing their asterisks.
 */

describe("parseInline", () => {
  it("extracts bold", () => {
    expect(parseInline("**My recommendation:** go")).toEqual([
      { type: "bold", value: "My recommendation:" },
      { type: "text", value: " go" },
    ])
  })

  it("extracts italic without swallowing bold", () => {
    expect(parseInline("start with *leadership* or **teamwork**")).toEqual([
      { type: "text", value: "start with " },
      { type: "italic", value: "leadership" },
      { type: "text", value: " or " },
      { type: "bold", value: "teamwork" },
    ])
  })

  it("extracts inline code", () => {
    expect(parseInline("run `npm test` now")).toEqual([
      { type: "text", value: "run " },
      { type: "code", value: "npm test" },
      { type: "text", value: " now" },
    ])
  })

  it("leaves plain text untouched", () => {
    expect(parseInline("no markup here")).toEqual([{ type: "text", value: "no markup here" }])
  })

  it("does not treat a lone asterisk as formatting", () => {
    expect(parseInline("2 * 3 = 6")).toEqual([{ type: "text", value: "2 * 3 = 6" }])
  })
})

describe("parseMarkdown", () => {
  it("splits paragraphs on blank lines", () => {
    const b = parseMarkdown("First para.\n\nSecond para.")
    expect(b).toHaveLength(2)
    expect(b.every(x => x.type === "paragraph")).toBe(true)
  })

  it("groups consecutive bullets into one list", () => {
    const b = parseMarkdown("Try:\n- one\n- two\n- three")
    expect(b[0].type).toBe("paragraph")
    expect(b[1]).toMatchObject({ type: "bullet" })
    expect(b[1].type === "bullet" && b[1].items).toHaveLength(3)
  })

  it("handles numbered lists", () => {
    const b = parseMarkdown("1. first\n2. second")
    expect(b[0]).toMatchObject({ type: "numbered" })
    expect(b[0].type === "numbered" && b[0].items).toHaveLength(2)
  })

  it("keeps heading text but drops the hashes", () => {
    const b = parseMarkdown("### Next steps")
    expect(b[0]).toEqual({ type: "paragraph", spans: [{ type: "text", value: "Next steps" }] })
  })

  it("parses formatting inside bullets", () => {
    const b = parseMarkdown("- focus on **results**")
    expect(b[0].type === "bullet" && b[0].items[0]).toEqual([
      { type: "text", value: "focus on " },
      { type: "bold", value: "results" },
    ])
  })

  it("survives empty and whitespace input", () => {
    expect(parseMarkdown("")).toEqual([])
    expect(parseMarkdown("   \n\n  ")).toEqual([])
  })
})

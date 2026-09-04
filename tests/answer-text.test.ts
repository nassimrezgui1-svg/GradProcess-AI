import { describe, it, expect } from "vitest"
import { pickAnswerText } from "@/lib/interview/answer-text"

describe("pickAnswerText", () => {
  it("uses the spoken transcript when transcription worked", () => {
    expect(pickAnswerText("I led a team of five to deliver the project.", "")).toBe(
      "I led a team of five to deliver the project."
    )
  })

  it("falls back to the typed answer when transcription is unsupported", () => {
    // Safari/Firefox: no Web Speech API, so nothing is transcribed.
    expect(pickAnswerText("", "I led a team of five.")).toBe("I led a team of five.")
  })

  it("prefers the fuller typed answer when transcription cut out mid-answer", () => {
    const partial = "I led a team"
    const complete = "I led a team of five to deliver a charity fundraiser that raised £3,000."
    expect(pickAnswerText(partial, complete)).toBe(complete)
  })

  it("keeps the transcript when the user typed only a stray note", () => {
    const spoken = "I led a team of five to deliver a charity fundraiser that raised £3,000."
    expect(pickAnswerText(spoken, "notes")).toBe(spoken)
  })

  it("trims whitespace and handles both sides empty", () => {
    expect(pickAnswerText("   ", "  ")).toBe("")
    expect(pickAnswerText("  spoken  ", "")).toBe("spoken")
  })

  it("tolerates undefined inputs without throwing", () => {
    expect(pickAnswerText(undefined as unknown as string, "typed")).toBe("typed")
    expect(pickAnswerText("spoken", undefined as unknown as string)).toBe("spoken")
  })
})

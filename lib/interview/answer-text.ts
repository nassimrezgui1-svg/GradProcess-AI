/**
 * Chooses the text an answer is scored on.
 *
 * Live transcription (Web Speech API) only exists in Chrome/Edge, and can also
 * cut out mid-answer. When that happens the candidate types instead, so the
 * typed answer must win whenever it carries more of the response than the
 * spoken transcript did — otherwise a partial transcript would silently be
 * scored in place of a complete written answer.
 */
export function pickAnswerText(spoken: string, typed: string): string {
  const s = (spoken ?? "").trim()
  const t = (typed ?? "").trim()
  return t.length > s.length ? t : s
}

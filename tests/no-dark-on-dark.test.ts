import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

/**
 * Guards against hardcoded text colours that are invisible on the app's own
 * dark surface. These are inline `style={{ color: "#..." }}` values, so the
 * globals.css utility remap cannot rescue them.
 *
 * Found in production on the auth pages: the consent notice "By using
 * GradProcess AI you agree to our Terms and Privacy Policy" rendered at
 * 1.9:1, and "Didn't receive it? Check your spam folder." — shown to someone
 * waiting on a verification email — at 1.83:1. The show/hide password buttons
 * sat at 2.50:1, below even the 3:1 floor that applies to non-text controls.
 */

const CARD_BG = "#0B1020"
const AA_TEXT = 4.5
const AA_NON_TEXT = 3.0  // WCAG 1.4.11: icons and UI components

function luminance(hex: string): number {
  const h = hex.replace("#", "")
  const ch = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255)
    .map(x => (x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)))
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2]
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    if (e.name === "node_modules" || e.name.startsWith(".")) return []
    const p = join(dir, e.name)
    return e.isDirectory() ? sourceFiles(p) : e.name.endsWith(".tsx") ? [p] : []
  })
}

const root = join(__dirname, "..")

describe("no inline text colour is invisible on the dark surface", () => {
  it("every hardcoded color: value clears AA, unless paired with its own light background", () => {
    const offenders: string[] = []

    for (const file of [...sourceFiles(join(root, "app")), ...sourceFiles(join(root, "components"))]) {
      const lines = readFileSync(file, "utf8").split("\n")
      lines.forEach((line, i) => {
        for (const m of line.matchAll(/(?<!background)[Cc]olor:\s*"(#[0-9A-Fa-f]{6})"/g)) {
          // Declarations that ship their own light background on the same line
          // are light-variant chips, not text on the dark card.
          if (/background(?:Color)?:\s*"#[EFef]/.test(line)) continue

          // WCAG holds icons and other non-text graphics to 3:1, not 4.5:1.
          // Two shapes count as non-text here: a rendered lucide icon (sized
          // with w-/h- classes), and a config object that pairs the colour with
          // the icon it tints, e.g. `{ label, value, icon: Target, color }`.
          const isIcon =
            /<[A-Z]\w+\s[^>]*className="[^"]*\bw-\d/.test(line) ||
            /\bicon:\s*[A-Z]\w*\s*,/.test(line)
          const floor = isIcon ? AA_NON_TEXT : AA_TEXT

          const ratio = contrast(m[1], CARD_BG)
          if (ratio < floor) {
            offenders.push(
              `${file.replace(root + "/", "")}:${i + 1} ${m[1]} = ${ratio.toFixed(2)}:1 (needs ${floor})`
            )
          }
        }
      })
    }

    expect(offenders, `text invisible on ${CARD_BG}:\n${offenders.join("\n")}`).toEqual([])
  })

  it("the auth consent notice is readable", () => {
    const layout = readFileSync(join(root, "app", "(auth)", "layout.tsx"), "utf8")
    expect(layout).not.toContain('color: "#334155"')
    const m = layout.match(/By using GradProcess AI[\s\S]{0,20}/)
    expect(m).not.toBeNull()
  })
})

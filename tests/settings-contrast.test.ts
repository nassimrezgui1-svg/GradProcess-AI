import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

/**
 * The Settings page failed WCAG AA on small text, and its tab strip was a
 * light-theme island in an otherwise dark app.
 *
 * Measured before the fix:
 *   gray-500 on gray-100 (inactive tab labels)  4.39:1  — AA needs 4.5:1
 *   gray-400 on white    (helper/meta text)     2.54:1
 */

const page = readFileSync(join(__dirname, "..", "app", "(app)", "settings", "page.tsx"), "utf8")

const TAILWIND_GREYS: Record<string, string> = {
  "gray-400": "#9ca3af", "gray-500": "#6b7280", "gray-600": "#4b5563",
  "gray-700": "#374151", "gray-900": "#111827",
}
const WHITE = "#ffffff"

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

describe("contrast maths", () => {
  it("reproduces the ratios that failed", () => {
    expect(contrast(TAILWIND_GREYS["gray-500"], "#f3f4f6")).toBeLessThan(4.5)
    expect(contrast(TAILWIND_GREYS["gray-400"], WHITE)).toBeLessThan(4.5)
  })
})

describe("Settings text meets WCAG AA", () => {
  it("uses no grey on white that falls below 4.5:1", () => {
    for (const [name, hex] of Object.entries(TAILWIND_GREYS)) {
      if (!page.includes(`text-${name}`)) continue
      const ratio = contrast(hex, WHITE)
      expect(ratio, `text-${name} on white is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5)
    }
  })

  it("no longer renders a light tab strip inside the dark app", () => {
    expect(page).not.toContain("bg-gray-100 rounded-2xl")
    expect(page).not.toContain('? "bg-white text-gray-900 shadow-sm"')
  })

  it("marks the selected tab for assistive technology", () => {
    expect(page).toMatch(/aria-current=\{activeTab === tab\.id \? "page" : undefined\}/)
  })

  it("keeps hover states that actually change colour", () => {
    for (const m of page.matchAll(/text-(gray-\d{3}) hover:text-(gray-\d{3})/g)) {
      expect(m[1], `hover on text-${m[1]} does not change colour`).not.toBe(m[2])
    }
  })
})

/**
 * The root cause was global, not page-local: globals.css remapped `.bg-white`
 * to the dark card surface (#0B1020) but left Tailwind's text and border
 * scales at their light-theme values. Every page written with light utilities
 * — 23 files, including the auth pages, the cookie banner and the psychometric
 * question cards — painted near-black text onto a near-black card.
 *
 * Measured in the browser before the fix: 1.09:1 for the Settings heading and
 * 1.02:1 for every field label. After: 18.1:1 and 12.75:1.
 */
describe("globals.css remaps text alongside surfaces", () => {
  const css = readFileSync(join(__dirname, "..", "app", "globals.css"), "utf8")
  const CARD = "#0B1020"

  it("still remaps the card surface", () => {
    expect(css).toMatch(/\.bg-white\s*\{\s*background-color:\s*#0B1020/i)
  })

  it("remaps every grey text utility the app actually uses", () => {
    for (const shade of ["gray-900", "gray-700", "gray-600", "gray-500", "gray-400"]) {
      expect(css, `text-${shade} is not remapped for the dark surface`)
        .toMatch(new RegExp(`\\.text-${shade}[^{]*\\{[^}]*color:`))
    }
  })

  it("every remapped text colour clears AA on the card surface", () => {
    const declared = [...css.matchAll(/\.text-(?:gray|slate)-\d{3}[^{]*\{\s*color:\s*(#[0-9A-Fa-f]{6})/g)]
    expect(declared.length).toBeGreaterThanOrEqual(5)
    for (const m of declared) {
      const ratio = contrast(m[1], CARD)
      expect(ratio, `${m[1]} on ${CARD} is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5)
    }
  })
})

/**
 * Remapping the grey text scale for the dark cards broke the tinted status
 * cards, which carry their own light background (bg-amber-50, bg-blue-50 and
 * friends) rather than bg-white. Their text-gray-900 headings became near-white
 * on cream: the STAR Builder feedback panels rendered as blank-looking boxes.
 *
 * Any light surface the app still uses has to be remapped alongside the text,
 * or the two disagree.
 */
describe("tinted status cards are remapped with the text", () => {
  const css = readFileSync(join(__dirname, "..", "app", "globals.css"), "utf8")

  function classesUsed(pattern: RegExp): string[] {
    const out = new Set<string>()
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap(e => {
        if (e.name === "node_modules" || e.name.startsWith(".")) return []
        const p = join(dir, e.name)
        return e.isDirectory() ? walk(p) : e.name.endsWith(".tsx") ? [p] : []
      })
    for (const f of [...walk(join(__dirname, "..", "app")), ...walk(join(__dirname, "..", "components"))]) {
      for (const m of readFileSync(f, "utf8").matchAll(pattern)) out.add(m[0])
    }
    return [...out]
  }

  it("every light tinted background in use is remapped", () => {
    const used = classesUsed(/bg-(?:amber|blue|red|green|emerald|yellow|orange|indigo|violet|purple|sky|rose)-(?:50|100)\b/g)
    const missing = used.filter(c => !css.includes("." + c))
    expect(missing, `light card surfaces with no dark remap:\n${missing.join("\n")}`).toEqual([])
  })

  it("every dark tinted text colour in use is remapped", () => {
    const used = classesUsed(/text-(?:amber|blue|red|green|emerald|yellow|orange|indigo|violet|purple|sky|rose)-(?:600|700|800|900)\b/g)
    const missing = used.filter(c => !css.includes("." + c))
    expect(missing, `dark tinted text with no light remap:\n${missing.join("\n")}`).toEqual([])
  })

  it("the surfaces stay translucent so they read as tints, not solid blocks", () => {
    expect(css).toMatch(/\.bg-amber-50[^{]*\{[^}]*rgba\(251,191,36,0\.1/)
  })
})

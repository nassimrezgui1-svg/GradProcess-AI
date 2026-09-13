import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

/**
 * Every AI endpoint was open to the internet.
 *
 * The paywall in proxy.ts checks PROTECTED_PATHS, which lists pages. A request
 * to /api/ai/generate-star did not match any of them, so isProtected() was
 * false and the proxy returned before running a single check. Verified against
 * production on 13 September 2026: a plain curl with no account, no
 * subscription and no cookie returned a complete STAR answer, HTTP 200.
 *
 * Two consequences. The entire paid product was free to anyone who read an
 * endpoint name out of the client bundle, and the bill landed on the project's
 * Anthropic account — which had already been drained to zero once, taking every
 * AI feature down for every paying customer at the same time.
 */

const root = join(__dirname, "..")
const aiDir = join(root, "app", "api", "ai")

function routeFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? routeFiles(join(dir, e.name)) : e.name === "route.ts" ? [join(dir, e.name)] : []
  )
}

describe("no paid endpoint is reachable without paying", () => {
  const paid = [...routeFiles(aiDir), join(root, "app", "api", "parse-cv", "route.ts")]

  it("covers every AI route and the upload route", () => {
    expect(paid.length).toBeGreaterThanOrEqual(14)
  })

  for (const f of paid) {
    const name = f.replace(root + "/app/api/", "").replace("/route.ts", "")
    it(`${name} requires a paying user`, () => {
      const src = readFileSync(f, "utf8")
      expect(src, `${name} never calls the guard`).toMatch(/requirePaidUser\(\)/)
      // and acts on the result rather than discarding it
      expect(src, `${name} ignores the guard's answer`).toMatch(/isBlocked\(guard\)\s*\)\s*return guard/)
    })
  }

  it("guards before doing any work inside the handler", () => {
    for (const f of paid) {
      const src = readFileSync(f, "utf8")
      // Only what happens inside POST counts — a module-scope client is just
      // construction, not work done on an unauthorised caller's behalf.
      const start = src.search(/export async function POST\(/)
      if (start === -1) continue
      const handler = src.slice(start)
      const guard = handler.indexOf("requirePaidUser()")
      const work = handler.search(/messages\.create|req\.json\(\)|formData\(\)/)
      expect(guard, `${f} reads the request before checking access`).toBeGreaterThan(-1)
      if (work === -1) continue
      expect(guard, `${f} does work before checking access`).toBeLessThan(work)
    }
  })
})

describe("the guard applies the same rule as the pages", () => {
  const guard = readFileSync(join(root, "lib", "api", "guard.ts"), "utf8")

  it("reuses hasProductAccess rather than reimplementing it", () => {
    // Two different definitions of "paid" would drift apart.
    expect(guard).toMatch(/import \{ hasProductAccess \} from "@\/lib\/access"/)
    expect(guard).toMatch(/hasProductAccess\(sub\?\.status\)/)
  })

  it("refuses when signed out, and separately when unpaid", () => {
    expect(guard).toMatch(/status: 401/)
    expect(guard).toMatch(/status: 402/)
  })

  it("takes the user from the session, never from the request body", () => {
    expect(guard).toMatch(/supabase\.auth\.getUser\(\)/)
    expect(guard).not.toMatch(/body\.userId|req\.json\(\)/)
  })
})

describe("the public surface stays public", () => {
  it("the news feed needs no account", () => {
    const news = readFileSync(join(root, "app", "api", "news", "route.ts"), "utf8")
    expect(news).not.toMatch(/requirePaidUser/)
  })

  it("the Stripe webhook is not behind the paywall", () => {
    // Stripe cannot sign in; it authenticates with a signature instead.
    const proxy = readFileSync(join(root, "proxy.ts"), "utf8")
    expect(proxy).toMatch(/api\/stripe\/webhook/)
    const webhook = readFileSync(join(root, "app", "api", "stripe", "webhook", "route.ts"), "utf8")
    expect(webhook).toMatch(/constructEvent/)
    expect(webhook).not.toMatch(/requirePaidUser/)
  })
})

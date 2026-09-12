import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * "Continue with Google" was the first control on both auth pages while the
 * provider was disabled in Supabase. Clicking it on production navigated to a
 * raw JSON error on a supabase.co URL, with no way back to the site:
 *
 *   {"code":400,"error_code":"validation_failed",
 *    "msg":"Unsupported provider: provider is not enabled"}
 *
 * A dead end on the primary sign-up path. The button must not render unless
 * the provider is actually configured.
 */

const root = join(__dirname, "..")
const signup = readFileSync(join(root, "app", "(auth)", "signup", "page.tsx"), "utf8")
const login = readFileSync(join(root, "app", "(auth)", "login", "page.tsx"), "utf8")
const flag = readFileSync(join(root, "lib", "auth-providers.ts"), "utf8")

describe("Google sign-in is only offered when it is configured", () => {
  for (const [name, src] of [["sign-up", signup], ["sign-in", login]] as const) {
    it(`the ${name} page gates the Google button behind the flag`, () => {
      expect(src).toContain("GOOGLE_AUTH_ENABLED")
      // The button must sit inside the conditional, not merely alongside it.
      const gate = src.indexOf("GOOGLE_AUTH_ENABLED &&")
      const button = src.indexOf("onClick={handleGoogle}")
      expect(gate).toBeGreaterThan(-1)
      expect(button).toBeGreaterThan(gate)
    })
  }

  it("defaults to hidden, so a missing env var cannot resurrect the dead end", () => {
    expect(flag).toContain('=== "true"')
  })
})

describe("the sign-up page does not promise a free assessment", () => {
  it("no longer offers something the paywall blocks", () => {
    // Every module requires a subscription; the page says so two lines below.
    expect(signup).not.toContain("Start your free readiness assessment today")
  })

  it("still states plainly that a subscription is required", () => {
    expect(signup).toMatch(/subscription is required/i)
  })
})

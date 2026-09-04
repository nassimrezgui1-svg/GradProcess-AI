import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "node:fs"
import { join } from "node:path"

/**
 * Regression tests for the auth callback path.
 *
 * The Supabase callback route only exists at app/api/auth/callback/route.ts,
 * but signup, Google OAuth and forgot-password all redirected to
 * "/auth/callback" (missing the /api segment) — a route that doesn't exist.
 * Every verification email and every Google sign-in landed on a 404.
 */

const root = join(__dirname, "..")
const CALLBACK_PATH = "/api/auth/callback"

const authFiles = [
  "app/(auth)/signup/page.tsx",
  "app/(auth)/login/page.tsx",
  "app/(auth)/forgot-password/page.tsx",
]

describe("auth redirect targets", () => {
  it("the callback route exists only at app/api/auth/callback", () => {
    expect(existsSync(join(root, "app", "api", "auth", "callback", "route.ts"))).toBe(true)
    expect(existsSync(join(root, "app", "(auth)", "callback", "page.tsx"))).toBe(false)
  })

  for (const file of authFiles) {
    it(`${file} redirects to ${CALLBACK_PATH}, not the missing /auth/callback`, () => {
      const src = readFileSync(join(root, file), "utf8")
      const redirects = [...src.matchAll(/(?:redirectTo|emailRedirectTo):\s*`[^`]*`/g)]
      expect(redirects.length, "no redirect target found").toBeGreaterThan(0)
      for (const m of redirects) {
        // The bug was a redirect straight to "/auth/callback" — no /api segment.
        // Assert on the literal broken string rather than a substring match,
        // since "/api/auth/callback" legitimately contains "/auth/callback".
        expect(m[0], "redirects to the non-existent bare /auth/callback (missing /api)").not.toMatch(
          /(?:origin|APP_URL)\}\/auth\/callback/
        )
        expect(m[0]).toContain(CALLBACK_PATH)
      }
    })
  }

  it("forgot-password does not depend on NEXT_PUBLIC_APP_URL (unset in production, wrong domain locally)", () => {
    const src = readFileSync(join(root, "app", "(auth)", "forgot-password", "page.tsx"), "utf8")
    expect(src).not.toContain("process.env.NEXT_PUBLIC_APP_URL")
    expect(src).toContain("window.location.origin")
  })

  it("the password-recovery destination page exists", () => {
    expect(existsSync(join(root, "app", "(auth)", "reset-password", "page.tsx"))).toBe(true)
  })

  it("forgot-password points at the destination page that actually exists", () => {
    const src = readFileSync(join(root, "app", "(auth)", "forgot-password", "page.tsx"), "utf8")
    expect(src).toContain("next=/reset-password")
  })
})

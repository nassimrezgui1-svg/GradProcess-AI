import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "node:fs"
import { join } from "node:path"

/**
 * Settings offered a "Permanently Delete My Account" button that called
 * /api/account/delete. The route did not exist — it returned 404 in production
 * — and the client never checked the response. A user typed DELETE, was signed
 * out, was redirected to a confirmation, and their account and every row of
 * their data remained.
 *
 * The privacy policy promised the opposite, in writing: "Erasure — delete your
 * account and all associated data", and "Deleted accounts: personal data purged
 * within 30 days". Right to erasure is an obligation under UK GDPR, not a
 * feature that can quietly no-op.
 *
 * Cascade behaviour was verified against the live database on a throwaway
 * account: user_profiles, subscriptions and module_results all went 1 -> 0 and
 * the auth user returned 404 afterwards.
 */

const root = join(__dirname, "..")
const routePath = join(root, "app", "api", "account", "delete", "route.ts")
const settings = readFileSync(join(root, "app", "(app)", "settings", "page.tsx"), "utf8")

describe("the delete endpoint exists and is ordered safely", () => {
  it("the route the button calls is actually there", () => {
    expect(existsSync(routePath), "/api/account/delete has no route file").toBe(true)
  })

  const route = existsSync(routePath) ? readFileSync(routePath, "utf8") : ""

  it("only ever deletes the account making the request", () => {
    expect(route).toMatch(/supabase\.auth\.getUser\(\)/)
    expect(route).toMatch(/status:\s*401/)
    // the id passed to deleteUser must come from the session, never from input
    expect(route).toMatch(/deleteUser\(user\.id\)/)
  })

  it("cancels billing before it deletes anything", () => {
    const cancel = route.indexOf("subscriptions.cancel")
    const destroy = route.indexOf("deleteUser(")
    expect(cancel, "no subscription cancellation").toBeGreaterThan(-1)
    expect(destroy).toBeGreaterThan(cancel)
  })

  it("refuses to delete if the subscription could not be cancelled", () => {
    // Otherwise a deleted account keeps being charged.
    expect(route).toMatch(/nothing was deleted/i)
    expect(route).toMatch(/status:\s*502/)
  })

  it("treats an already-cancelled subscription as fine", () => {
    expect(route).toMatch(/resource_missing|statusCode === 404/)
  })

  it("says so rather than half-deleting when the key is missing", () => {
    expect(route).toMatch(/SUPABASE_SERVICE_ROLE_KEY/)
    expect(route).toMatch(/status:\s*503/)
  })
})

describe("the button tells the truth about what happened", () => {
  it("checks the response instead of assuming success", () => {
    const handler = settings.slice(settings.indexOf("const handleDeleteAccount"))
    const body = handler.slice(0, handler.indexOf("\n  }") + 4)
    expect(body).toMatch(/if \(!res\.ok\)/)
    expect(body).toMatch(/setDeleteError/)
  })

  it("only signs the user out once deletion succeeded", () => {
    const handler = settings.slice(settings.indexOf("const handleDeleteAccount"))
    const body = handler.slice(0, handler.indexOf("\n  }") + 4)
    const guard = body.indexOf("if (!res.ok)")
    const signOut = body.indexOf("signOut()")
    expect(guard).toBeGreaterThan(-1)
    expect(signOut).toBeGreaterThan(guard)
  })

  it("shows the failure on screen", () => {
    expect(settings).toMatch(/\{deleteError &&/)
  })

  it("does not promise deletion somewhere it is not offered", () => {
    // The Privacy tab claimed "request deletion at any time" beside an Export
    // button and nothing else.
    expect(settings).not.toMatch(/Export or request deletion at any time/)
  })
})

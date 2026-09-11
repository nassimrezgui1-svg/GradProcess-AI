import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { hasProductAccess, requiresSubscription, PAYWALL_REDIRECT } from "@/lib/access"

/**
 * The paywall. Signing up creates an account but grants nothing until Stripe
 * reports a payment.
 *
 * Before this, the signup trigger created every subscription with
 * status 'active' on the free plan, and the gate only checked status — so
 * every free signup walked straight through and got the whole product.
 */

describe("hasProductAccess", () => {
  it("grants access to paying and trialing subscriptions", () => {
    expect(hasProductAccess("active")).toBe(true)
    expect(hasProductAccess("trialing")).toBe(true)
  })

  it("refuses every unpaid Stripe status", () => {
    for (const status of [
      "incomplete",          // account created, never paid — the new default
      "incomplete_expired",
      "past_due",
      "unpaid",
      "canceled",
      "cancelled",
      "paused",
    ]) {
      expect(hasProductAccess(status), status).toBe(false)
    }
  })

  it("fails closed on missing, null or unknown values", () => {
    // A paywall that errors open is not a paywall.
    for (const value of [undefined, null, "", "ACTIVE", "Active", "free", "pro", "bogus"]) {
      expect(hasProductAccess(value as string | null | undefined), String(value)).toBe(false)
    }
  })
})

describe("requiresSubscription", () => {
  it("gates every product surface", () => {
    for (const path of [
      "/dashboard",
      "/cv-tailoring",
      "/star-builder",
      "/video-interview",
      "/psychometric",
      "/industry-hub",
      "/reports",
      "/tracker",
      "/tracker/abc-123",
      "/settings",
    ]) {
      expect(requiresSubscription(path), path).toBe(true)
    }
  })

  it("leaves open the routes an unpaid user needs", () => {
    // Gating any of these would trap a blocked user with no way to pay,
    // sign in, or recover their password.
    for (const path of [
      "/billing",
      "/pricing",
      "/login",
      "/signup",
      "/onboarding",
      "/forgot-password",
      "/reset-password",
      "/verify-email",
    ]) {
      expect(requiresSubscription(path), path).toBe(false)
    }
  })

  it("does not let a prefix trick open a gated path", () => {
    // "/billing-secrets" must not inherit "/billing"'s exemption.
    expect(requiresSubscription("/billing-secrets")).toBe(true)
    expect(requiresSubscription("/pricingxyz")).toBe(true)
    expect(requiresSubscription("/billing/invoices")).toBe(false) // genuine sub-path
  })

  it("sends blocked users to pricing with the gate flag", () => {
    expect(PAYWALL_REDIRECT).toBe("/pricing?gate=1")
  })
})

describe("signup grants no access by default", () => {
  const sqlDir = join(__dirname, "..", "supabase")
  const paywall = readFileSync(join(sqlDir, "migration-2026-09-paywall.sql"), "utf8")

  it("the newest trigger creates subscriptions as incomplete, not active", () => {
    expect(paywall).toMatch(/VALUES \(NEW\.id, 'free', 'incomplete'\)/)
    expect(paywall).not.toMatch(/VALUES \(NEW\.id, 'free', 'active'\)/)
  })

  it("sets the column default to incomplete as a second line of defence", () => {
    expect(paywall).toMatch(/ALTER COLUMN status SET DEFAULT 'incomplete'/)
  })

  it("grandfathers existing accounts rather than revoking them", () => {
    // Existing rows already carry 'active'; the migration must not rewrite them.
    expect(paywall).not.toMatch(/UPDATE public\.subscriptions\s+SET status/)
    expect(paywall).toMatch(/LEFT JOIN public\.subscriptions/)
  })

  it("no SQL file anywhere creates a new account as active", () => {
    // Migrations get run in filename order, so an older file sorting after the
    // paywall one would silently reopen it. Every definition must agree.
    for (const f of readdirSync(sqlDir).filter(n => n.endsWith(".sql"))) {
      const sql = readFileSync(join(sqlDir, f), "utf8")
      expect(sql, `${f} makes new signups active`).not.toMatch(
        /VALUES \(NEW\.id, 'free', 'active'\)/
      )
    }
  })
})

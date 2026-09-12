import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

/**
 * A real customer paid £9.99 and was locked out.
 *
 * The webhook wrote plan = 'pro', but the live subscriptions.plan CHECK
 * constraint only allowed ('free','premium'). The upsert was rejected, the
 * error was logged and swallowed, Stripe received a 200, and the account
 * stayed 'incomplete'. It would have happened to every customer.
 *
 * Three defences, each tested here:
 *   1. the constraint accepts what the code writes
 *   2. a refused write retries with only the fields that grant access
 *   3. if that also fails, the webhook returns non-2xx so Stripe retries
 */

const root = join(__dirname, "..")
const webhook = readFileSync(join(root, "app", "api", "stripe", "webhook", "route.ts"), "utf8")
const sqlDir = join(root, "supabase")

describe("subscription plan values", () => {
  const constraintFix = readFileSync(join(sqlDir, "migration-2026-09-plan-constraint.sql"), "utf8")

  it("the constraint allows every plan value the webhook writes", () => {
    const written = [...webhook.matchAll(/plan:\s*"([a-z_]+)"/g)].map(m => m[1])
    expect(written.length).toBeGreaterThan(0)

    const allowed = constraintFix.match(
      /ADD CONSTRAINT subscriptions_plan_check\s*\n?\s*CHECK \(plan IN \(([^)]+)\)\)/
    )
    expect(allowed, "plan constraint not found in the migration").not.toBeNull()
    const values = [...allowed![1].matchAll(/'([a-z_]+)'/g)].map(m => m[1])

    for (const plan of written) {
      expect(values, `webhook writes plan "${plan}", which the constraint rejects`).toContain(plan)
    }
  })

  it("keeps 'premium' so rows already using it stay valid", () => {
    expect(constraintFix).toMatch(/'premium'/)
  })

  it("repairs paying accounts whose plan never updated", () => {
    expect(constraintFix).toMatch(/UPDATE public\.subscriptions[\s\S]*status IN \('active', 'trialing'\)/)
  })
})

describe("webhook cannot lock out a paying customer", () => {
  it("retries with access-granting fields when the full write is refused", () => {
    expect(webhook).toMatch(/retrying with access fields only/i)
    // The retry must not carry the column that caused the original rejection.
    const retry = webhook.slice(webhook.indexOf("retryError"))
    const retryPayload = retry.slice(0, retry.indexOf("}, { onConflict"))
    expect(retryPayload).not.toMatch(/plan:/)
    expect(retryPayload).toMatch(/status:/)
  })

  it("returns non-2xx when both writes fail, so Stripe retries the event", () => {
    // Swallowing the error is what let the original failure go unnoticed.
    expect(webhook).toMatch(/status:\s*500/)
    expect(webhook).toMatch(/CRITICAL/)
  })

  it("never lets the descriptive profile update decide access", () => {
    // user_profiles.plan is cosmetic; a failure there must not throw.
    const profileBlock = webhook.slice(webhook.indexOf('from("user_profiles")'))
    expect(profileBlock).toMatch(/profileError/)
  })

  it("still verifies the Stripe signature before touching the database", () => {
    const sig = webhook.indexOf("constructEvent")
    const db = webhook.indexOf(".from(")
    expect(sig).toBeGreaterThan(-1)
    expect(db).toBeGreaterThan(sig)
  })
})

describe("schema and migrations agree on plan values", () => {
  it("no SQL file restricts plan to a set missing 'pro'", () => {
    for (const f of readdirSync(sqlDir).filter(n => n.endsWith(".sql"))) {
      const sql = readFileSync(join(sqlDir, f), "utf8")
      for (const m of sql.matchAll(/CHECK \(plan IN \(([^)]+)\)\)/g)) {
        const values = [...m[1].matchAll(/'([a-z_]+)'/g)].map(v => v[1])
        expect(values, `${f} defines a plan constraint without 'pro'`).toContain("pro")
      }
    }
  })
})

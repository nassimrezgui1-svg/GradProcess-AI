import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * Regression test for the webhook↔schema drift found in the July 2026 audit:
 * the Stripe webhook wrote `stripe_subscription_id`, `cancel_at_period_end`,
 * plan `student_pro`, and targeted a `profiles` table — none of which existed
 * in supabase/schema.sql. This suite statically asserts the webhook only
 * references columns, plan values, and tables the schema actually defines.
 */

const root = join(__dirname, "..")
const schema = readFileSync(join(root, "supabase", "schema.sql"), "utf8")
const webhook = readFileSync(join(root, "app", "api", "stripe", "webhook", "route.ts"), "utf8")

function tableColumns(sql: string, table: string): string[] {
  const match = sql.match(
    new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${table} \\(([\\s\\S]*?)\\n\\);`)
  )
  if (!match) return []
  return match[1]
    .split("\n")
    .map(line => line.trim().split(/\s+/)[0])
    .filter(col => /^[a-z_]+$/.test(col))
}

describe("Stripe webhook ↔ schema consistency", () => {
  const subscriptionCols = tableColumns(schema, "subscriptions")

  it("schema defines the subscriptions columns the webhook writes", () => {
    for (const col of [
      "user_id",
      "stripe_customer_id",
      "stripe_subscription_id",
      "plan",
      "status",
      "cancel_at_period_end",
      "current_period_end",
      "updated_at",
    ]) {
      expect(subscriptionCols, `missing column: ${col}`).toContain(col)
    }
  })

  it("webhook only writes plan values the CHECK constraint allows", () => {
    const allowed = schema.match(/plan\s+TEXT NOT NULL DEFAULT 'free' CHECK \(plan IN \(([^)]+)\)\)/)
    expect(allowed).not.toBeNull()
    const allowedValues = [...allowed![1].matchAll(/'([a-z_]+)'/g)].map(m => m[1])

    const written = [...webhook.matchAll(/plan:\s*"([a-z_]+)"/g)].map(m => m[1])
    expect(written.length).toBeGreaterThan(0)
    for (const value of written) {
      expect(allowedValues, `plan "${value}" violates CHECK constraint`).toContain(value)
    }
  })

  it("webhook targets tables that exist in the schema", () => {
    const targeted = [...webhook.matchAll(/\.from\("([a-z_]+)"\)/g)].map(m => m[1])
    expect(targeted.length).toBeGreaterThan(0)
    for (const table of targeted) {
      expect(schema, `table "${table}" not in schema.sql`).toContain(
        `CREATE TABLE IF NOT EXISTS public.${table} (`
      )
    }
  })

  it("user_profiles has the plan column the webhook syncs", () => {
    expect(tableColumns(schema, "user_profiles")).toContain("plan")
  })

  it("webhook verifies Stripe signatures before touching the database", () => {
    const sigIndex = webhook.indexOf("constructEvent")
    const dbIndex = webhook.indexOf(".from(")
    expect(sigIndex).toBeGreaterThan(-1)
    expect(dbIndex).toBeGreaterThan(sigIndex)
  })
})

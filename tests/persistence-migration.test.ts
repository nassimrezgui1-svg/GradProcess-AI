import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * Regression tests for supabase/migration-2026-08-persistence.sql.
 *
 * The August 2026 E2E run found that a *partial* unique index
 * (`... WHERE client_id IS NOT NULL`) cannot back a Supabase
 * `.upsert(..., { onConflict: "user_id,client_id" })` — Postgres rejects it
 * with SQLSTATE 42P10. Every conflict target used by lib/db/cloud.ts must be
 * covered by a full unique index or primary key.
 */

const root = join(__dirname, "..")
const migration = readFileSync(join(root, "supabase", "migration-2026-08-persistence.sql"), "utf8")
const cloud = readFileSync(join(root, "lib", "db", "cloud.ts"), "utf8")

function uniqueIndexOn(table: string, cols: string): RegExpMatchArray | null {
  // Matches: CREATE UNIQUE INDEX IF NOT EXISTS <name> ON public.<table> (<cols>)<rest up to ;>
  const re = new RegExp(
    `CREATE UNIQUE INDEX IF NOT EXISTS \\w+\\s+ON public\\.${table}\\s*\\(${cols.replace(",", ",\\s*")}\\)([^;]*);`
  )
  return migration.match(re)
}

describe("persistence migration ↔ cloud sync consistency", () => {
  it("every onConflict target in cloud.ts is a (user_id,client_id) or user_id key", () => {
    const targets = [...cloud.matchAll(/onConflict:\s*"([^"]+)"/g)].map(m => m[1])
    expect(targets.length).toBeGreaterThan(0)
    for (const t of targets) {
      expect(["user_id,client_id", "user_id"], `unexpected conflict target ${t}`).toContain(t)
    }
  })

  it("module_results has a FULL unique index on (user_id, client_id)", () => {
    const m = uniqueIndexOn("module_results", "user_id, client_id")
    expect(m, "missing unique index").not.toBeNull()
    expect(m![1], "index must not be partial (WHERE …) — breaks upsert onConflict").not.toMatch(/WHERE/i)
  })

  it("applications has a FULL unique index on (user_id, client_id)", () => {
    const m = uniqueIndexOn("applications", "user_id, client_id")
    expect(m, "missing unique index").not.toBeNull()
    expect(m![1]).not.toMatch(/WHERE/i)
  })

  it("user_gamification keys on user_id (primary key) for its upsert", () => {
    expect(migration).toMatch(/user_gamification \(\s*user_id\s+UUID PRIMARY KEY/)
  })

  it("is self-contained: defines set_updated_at() before any trigger uses it", () => {
    const def = migration.indexOf("CREATE OR REPLACE FUNCTION public.set_updated_at()")
    const firstUse = migration.indexOf("EXECUTE FUNCTION public.set_updated_at()")
    expect(def).toBeGreaterThan(-1)
    expect(firstUse).toBeGreaterThan(def)
  })

  it("uses gen_random_uuid() so no extension is required", () => {
    expect(migration).not.toMatch(/uuid_generate_v4/)
  })

  it("enables RLS with an owner policy on every table it creates", () => {
    for (const table of ["module_results", "user_gamification", "applications"]) {
      expect(migration).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`)
      expect(migration).toMatch(new RegExp(`CREATE POLICY "\\w+" ON public\\.${table}\\s+FOR ALL USING \\(auth\\.uid\\(\\) = user_id\\)`))
    }
  })
})

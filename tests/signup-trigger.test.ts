import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

/**
 * Regression tests for the signup trigger.
 *
 * August 2026: handle_new_user() inserted into public.user_settings, a table
 * that did not exist on the production database. Because the trigger fires
 * AFTER INSERT ON auth.users, the failed insert aborted the whole statement
 * and every signup died with "Database error saving new user".
 *
 * Two invariants protect against a repeat:
 *   1. every table the trigger writes to is created by the SQL in this repo
 *   2. each insert is wrapped so it can never abort account creation
 */

const sqlDir = join(__dirname, "..", "supabase")
const sqlFiles = readdirSync(sqlDir).filter(f => f.endsWith(".sql"))
const allSql = sqlFiles.map(f => readFileSync(join(sqlDir, f), "utf8")).join("\n")
const schema = readFileSync(join(sqlDir, "schema.sql"), "utf8")

function triggerBody(sql: string): string {
  const start = sql.indexOf("CREATE OR REPLACE FUNCTION public.handle_new_user()")
  expect(start, "handle_new_user not found").toBeGreaterThan(-1)
  return sql.slice(start, sql.indexOf("$$ LANGUAGE plpgsql SECURITY DEFINER;", start))
}

describe("handle_new_user signup trigger", () => {
  const body = triggerBody(schema)

  it("only writes to tables some SQL file in this repo creates", () => {
    const targets = [...body.matchAll(/INSERT INTO public\.(\w+)/g)].map(m => m[1])
    expect(targets.length).toBeGreaterThan(0)
    for (const table of targets) {
      expect(
        allSql,
        `trigger inserts into public.${table}, which no SQL file creates`
      ).toContain(`CREATE TABLE IF NOT EXISTS public.${table} (`)
    }
  })

  it("isolates every insert so one failure cannot abort signup", () => {
    const inserts = [...body.matchAll(/INSERT INTO public\.\w+/g)].length
    const handlers = [...body.matchAll(/EXCEPTION WHEN OTHERS THEN/g)].length
    expect(handlers, "each insert needs its own EXCEPTION handler").toBe(inserts)
  })

  it("stays idempotent so a replayed insert cannot raise", () => {
    const inserts = [...body.matchAll(/INSERT INTO public\.\w+/g)].length
    const conflicts = [...body.matchAll(/ON CONFLICT[^;]*DO NOTHING/g)].length
    expect(conflicts).toBe(inserts)
  })

  it("runs as SECURITY DEFINER so RLS cannot block it", () => {
    expect(schema).toContain("$$ LANGUAGE plpgsql SECURITY DEFINER;")
  })

  it("ships a migration that creates user_settings and backfills existing users", () => {
    const fix = readFileSync(join(sqlDir, "migration-2026-08-signup-trigger-fix.sql"), "utf8")
    expect(fix).toContain("CREATE TABLE IF NOT EXISTS public.user_settings (")
    expect(fix).toMatch(/INSERT INTO public\.user_settings \(user_id\)[\s\S]*FROM auth\.users/)
    expect(fix).toContain("ENABLE ROW LEVEL SECURITY")
  })

  it("migrations avoid uuid_generate_v4 so no extension is required", () => {
    for (const f of sqlFiles.filter(n => n.startsWith("migration-"))) {
      const sql = readFileSync(join(sqlDir, f), "utf8")
      expect(sql, `${f} uses uuid_generate_v4`).not.toMatch(/uuid_generate_v4/)
    }
  })
})

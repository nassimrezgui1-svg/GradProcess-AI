import { describe, it, expect, vi, afterEach } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { postAI, AiRequestError, AI_TIMEOUT_MS } from "@/lib/ai/request"

/**
 * AI calls had no timeout on either side. A September 2026 audit recorded
 * requests held open for 41s and 113s, and STAR generation and psychometric
 * question generation that never resolved at all — the button simply span
 * forever with no error and no way back.
 */

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })

describe("postAI", () => {
  it("returns the parsed body on success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ questions: [1, 2] }),
    }))
    await expect(postAI("/api/ai/x", {})).resolves.toEqual({ questions: [1, 2] })
  })

  it("aborts rather than hanging, and says so", async () => {
    // Mimics fetch rejecting because its AbortSignal fired.
    vi.stubGlobal("fetch", vi.fn().mockImplementation((_u: string, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener("abort", () => {
          const e = new Error("aborted"); e.name = "AbortError"; reject(e)
        })
      })
    ))
    const promise = postAI("/api/ai/slow", {}, { timeoutMs: 10 })
    await expect(promise).rejects.toBeInstanceOf(AiRequestError)
    await expect(promise).rejects.toMatchObject({ kind: "timeout" })
  })

  it("surfaces the server's own error message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false, status: 503, json: async () => ({ error: "Payments are not configured yet." }),
    }))
    await expect(postAI("/api/ai/x", {})).rejects.toThrow("Payments are not configured yet.")
  })

  it("falls back to a readable message when the server sends none", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false, status: 500, json: async () => { throw new Error("no body") },
    }))
    await expect(postAI("/api/ai/x", {})).rejects.toThrow(/Request failed \(500\)/)
  })

  it("reports a network failure distinctly from a timeout", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")))
    await expect(postAI("/api/ai/x", {})).rejects.toMatchObject({ kind: "network" })
  })

  it("uses a ceiling long enough for a real generation but not unbounded", () => {
    // Answer analysis legitimately took ~25s in the audit.
    expect(AI_TIMEOUT_MS).toBeGreaterThanOrEqual(30_000)
    expect(AI_TIMEOUT_MS).toBeLessThanOrEqual(60_000)
  })
})

describe("server-side limits", () => {
  const aiDir = join(__dirname, "..", "app", "api", "ai")

  function routeFiles(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap(e =>
      e.isDirectory() ? routeFiles(join(dir, e.name)) : e.name === "route.ts" ? [join(dir, e.name)] : []
    )
  }

  it("every AI route caps its own duration", () => {
    const files = routeFiles(aiDir)
    expect(files.length).toBeGreaterThan(5)
    for (const f of files) {
      expect(readFileSync(f, "utf8"), `${f} has no maxDuration`).toMatch(/export const maxDuration\s*=\s*\d+/)
    }
  })

  it("no AI call site bypasses the timeout helper with a bare fetch", () => {
    const service = readFileSync(join(__dirname, "..", "lib", "ai", "service.ts"), "utf8")
    expect(service).toContain("postAI")
    expect(service).not.toMatch(/await fetch\(/)
  })
})

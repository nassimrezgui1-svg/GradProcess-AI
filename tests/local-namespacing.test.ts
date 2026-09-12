import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  activeUser, setActiveUser, readLocal, writeLocal, discardLegacyData,
} from "@/lib/db/local"

// Minimal localStorage stand-in — the module only uses get/set/remove.
function installStorage() {
  const store = new Map<string, string>()
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => { store.set(k, v) },
    removeItem: (k: string) => { store.delete(k) },
    clear: () => store.clear(),
  })
  vi.stubGlobal("window", { localStorage, dispatchEvent: () => true })
  return store
}

describe("per-account cache isolation", () => {
  let store: Map<string, string>
  beforeEach(() => { store = installStorage() })

  it("defaults to the anonymous namespace before sign-in", () => {
    expect(activeUser()).toBe("anon")
  })

  it("keeps two accounts' data completely separate", () => {
    setActiveUser("user-a")
    writeLocal("gradprocess_scores", { cv: [{ score: 91 }] })

    setActiveUser("user-b")
    expect(readLocal("gradprocess_scores", null)).toBeNull()

    writeLocal("gradprocess_scores", { cv: [{ score: 42 }] })
    expect(readLocal<{ cv: { score: number }[] }>("gradprocess_scores", { cv: [] }).cv[0].score).toBe(42)

    // Switching back must restore the first account's own data, unchanged.
    setActiveUser("user-a")
    expect(readLocal<{ cv: { score: number }[] }>("gradprocess_scores", { cv: [] }).cv[0].score).toBe(91)
  })

  it("returns the fallback rather than throwing on corrupt cached JSON", () => {
    setActiveUser("user-a")
    localStorage.setItem("gradprocess_scores::user-a", "{not json")
    expect(readLocal("gradprocess_scores", { cv: [] })).toEqual({ cv: [] })
  })
})

describe("discardLegacyData", () => {
  beforeEach(() => { installStorage() })

  /**
   * Pre-account data used to be *claimed* by the first account to sign in.
   * That handed one person's work to whoever signed up next on the same
   * browser — a September 2026 audit found a fresh account showing a STAR
   * score of 62/100 it had never earned.
   */
  it("never gives pre-account data to an account", () => {
    localStorage.setItem("gradprocess_tracker", JSON.stringify([{ id: "someone-elses" }]))

    discardLegacyData()
    setActiveUser("user-a")

    expect(readLocal<{ id: string }[]>("gradprocess_tracker", [])).toEqual([])
  })

  it("removes the unscoped copy entirely", () => {
    localStorage.setItem("gradprocess_scores", JSON.stringify({ cv: [{ score: 99 }] }))
    localStorage.setItem("gradprocess_gamification", JSON.stringify({ xp: 500 }))

    discardLegacyData()

    expect(localStorage.getItem("gradprocess_scores")).toBeNull()
    expect(localStorage.getItem("gradprocess_gamification")).toBeNull()
  })

  it("leaves an account's own namespaced data untouched", () => {
    localStorage.setItem("gradprocess_scores::user-a", JSON.stringify({ cv: [{ score: 80 }] }))
    localStorage.setItem("gradprocess_scores", JSON.stringify({ cv: [{ score: 10 }] }))

    discardLegacyData()
    setActiveUser("user-a")

    expect(readLocal<{ cv: { score: number }[] }>("gradprocess_scores", { cv: [] }).cv[0].score).toBe(80)
  })

  it("is safe to call when there is nothing to discard", () => {
    expect(() => discardLegacyData()).not.toThrow()
  })
})

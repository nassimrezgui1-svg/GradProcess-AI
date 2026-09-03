import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  activeUser, setActiveUser, readLocal, writeLocal, claimLegacyData,
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

describe("claimLegacyData", () => {
  beforeEach(() => { installStorage() })

  it("moves pre-account data to the first account that signs in", () => {
    localStorage.setItem("gradprocess_tracker", JSON.stringify([{ id: "app-1" }]))

    expect(claimLegacyData("user-a")).toBe(true)
    setActiveUser("user-a")
    expect(readLocal<{ id: string }[]>("gradprocess_tracker", [])).toHaveLength(1)
  })

  it("removes the unscoped copy so a second account cannot inherit it", () => {
    localStorage.setItem("gradprocess_tracker", JSON.stringify([{ id: "app-1" }]))
    claimLegacyData("user-a")

    expect(localStorage.getItem("gradprocess_tracker")).toBeNull()
    expect(claimLegacyData("user-b")).toBe(false)
    setActiveUser("user-b")
    expect(readLocal<{ id: string }[]>("gradprocess_tracker", [])).toEqual([])
  })

  it("never overwrites data the account already has", () => {
    localStorage.setItem("gradprocess_scores::user-a", JSON.stringify({ cv: [{ score: 80 }] }))
    localStorage.setItem("gradprocess_scores", JSON.stringify({ cv: [{ score: 10 }] }))

    claimLegacyData("user-a")
    setActiveUser("user-a")
    expect(readLocal<{ cv: { score: number }[] }>("gradprocess_scores", { cv: [] }).cv[0].score).toBe(80)
  })
})

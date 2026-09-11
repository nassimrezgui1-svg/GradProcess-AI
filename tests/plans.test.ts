import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import {
  PLANS,
  ANNUAL_SAVING,
  ANNUAL_SAVING_PCT,
  formatPrice,
  isPlanKey,
} from "@/lib/plans"

const root = join(__dirname, "..")

describe("plan pricing", () => {
  it("prices annual 10% below twelve monthly payments", () => {
    expect(ANNUAL_SAVING_PCT).toBe(10)
  })

  it("annual costs less per month than monthly", () => {
    expect(PLANS.annual.perMonth).toBeLessThan(PLANS.monthly.perMonth)
  })

  it("annual total equals twelve times its per-month figure", () => {
    // Keeps the headline "/month" price honest against the amount charged.
    expect(PLANS.annual.perMonth * 12).toBe(PLANS.annual.amount)
  })

  it("monthly per-month equals the amount charged", () => {
    expect(PLANS.monthly.perMonth).toBe(PLANS.monthly.amount)
  })

  it("states the saving in pence correctly", () => {
    expect(ANNUAL_SAVING).toBe(1999 * 12 - 21588)
    expect(ANNUAL_SAVING).toBe(2400) // £24.00
  })

  it("uses the right Stripe intervals", () => {
    expect(PLANS.monthly.interval).toBe("month")
    expect(PLANS.annual.interval).toBe("year")
  })
})

describe("formatPrice", () => {
  it("shows pence when present", () => {
    expect(formatPrice(1999)).toBe("£19.99")
    expect(formatPrice(21588)).toBe("£215.88")
  })
  it("hides .00 on whole pounds", () => {
    expect(formatPrice(2000)).toBe("£20")
  })
  it("handles zero", () => {
    expect(formatPrice(0)).toBe("£0")
  })
})

describe("isPlanKey", () => {
  it("accepts the real plans", () => {
    expect(isPlanKey("monthly")).toBe(true)
    expect(isPlanKey("annual")).toBe(true)
  })
  it("rejects anything else, including prototype keys", () => {
    for (const bad of ["student_pro", "", "toString", "constructor", null, 7, {}]) {
      expect(isPlanKey(bad), String(bad)).toBe(false)
    }
  })
})

describe("server/client boundary", () => {
  it("lib/plans.ts never imports the Stripe SDK", () => {
    // plans.ts is bundled into the browser. Importing the SDK there would ship
    // server code to the client and is the mistake this guards against.
    const plans = readFileSync(join(root, "lib", "plans.ts"), "utf8")
    expect(plans).not.toMatch(/from ["']stripe["']/)
    expect(plans).not.toMatch(/STRIPE_SECRET_KEY/)
    expect(plans).not.toMatch(/STRIPE_PRICE_/)
  })

  it("client components import plan data from lib/plans, never lib/stripe", () => {
    for (const file of [
      join("app", "(marketing)", "pricing", "page.tsx"),
      join("app", "(app)", "billing", "page.tsx"),
    ]) {
      const src = readFileSync(join(root, file), "utf8")
      expect(src, `${file} is a client component`).toMatch(/^"use client"/)
      expect(src, `${file} must not import lib/stripe`).not.toMatch(/from ["']@\/lib\/stripe["']/)
    }
  })

  it("lib/stripe.ts keeps the Price IDs, and they stay out of the client module", () => {
    const stripe = readFileSync(join(root, "lib", "stripe.ts"), "utf8")
    expect(stripe).toMatch(/STRIPE_PRICE_MONTHLY/)
    expect(stripe).toMatch(/STRIPE_PRICE_ANNUAL/)
  })
})

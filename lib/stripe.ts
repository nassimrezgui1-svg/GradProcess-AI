import Stripe from "stripe"
import { PLANS as PLAN_DISPLAY, type PlanKey } from "@/lib/plans"

// SERVER ONLY — do not import from a client component.
// This module pulls in the Stripe SDK and reads STRIPE_SECRET_KEY, so importing
// it from the browser would bloat the bundle and put server config on a path it
// has no business being on. Anything the UI renders lives in lib/plans.ts,
// which is deliberately free of both.

// Lazily initialized so the module can be imported (and the app built) without
// STRIPE_SECRET_KEY being set. Routes fail at request time with a clear error
// instead of crashing the build.
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not configured")
    }
    _stripe = new Stripe(key, {
      apiVersion: "2026-04-22.dahlia",
    })
  }
  return _stripe
}

/**
 * The Stripe Price ID each plan maps to. Empty until the environment is
 * configured; the checkout route turns that into a clear 503 rather than
 * sending Stripe an empty price.
 *
 * STRIPE_STUDENT_PRO_PRICE_ID is the previous single-plan name, kept so an
 * existing deployment keeps working after this change.
 */
export function priceIdFor(plan: PlanKey): string {
  switch (plan) {
    case "monthly":
      return process.env.STRIPE_PRICE_MONTHLY ?? process.env.STRIPE_STUDENT_PRO_PRICE_ID ?? ""
    case "annual":
      return process.env.STRIPE_PRICE_ANNUAL ?? ""
  }
}

export { PLAN_DISPLAY as PLANS }
export type { PlanKey }

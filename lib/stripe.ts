import Stripe from "stripe"

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

export const PLANS = {
  student_pro: {
    priceId: process.env.STRIPE_STUDENT_PRO_PRICE_ID!,
    name: "Student Pro",
    amount: 1999,
  },
} as const

export type PlanKey = keyof typeof PLANS

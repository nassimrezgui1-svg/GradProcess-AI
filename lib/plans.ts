/**
 * Plan display data — safe to import from client components.
 *
 * Deliberately free of the Stripe SDK and of any Price IDs: this module is
 * bundled into the browser, so it carries only what the UI needs to render.
 * Stripe Price IDs and the secret key live in lib/stripe.ts, which is
 * server-only.
 *
 * Annual is priced 10% below twelve monthly payments:
 *   monthly  £19.99 x 12 = £239.88
 *   annual   £215.88      = £17.99/month, saving £24.00 a year.
 * These figures must be kept in step with the prices in the Stripe dashboard,
 * which are what customers are actually charged.
 */

export type BillingInterval = "month" | "year"

export interface PlanDisplay {
  name: string
  interval: BillingInterval
  /** Charged per billing period, in pence. */
  amount: number
  /** Effective cost per month, in pence — lets the UI compare like with like. */
  perMonth: number
}

export const PLANS = {
  monthly: {
    name: "Student Pro — Monthly",
    interval: "month",
    amount: 1999,
    perMonth: 1999,
  },
  annual: {
    name: "Student Pro — Annual",
    interval: "year",
    amount: 21588,
    perMonth: 1799,
  },
} as const satisfies Record<string, PlanDisplay>

export type PlanKey = keyof typeof PLANS

export function isPlanKey(value: unknown): value is PlanKey {
  return typeof value === "string" && Object.hasOwn(PLANS, value)
}

/** Saving of annual against twelve monthly payments, in pence. */
export const ANNUAL_SAVING = PLANS.monthly.amount * 12 - PLANS.annual.amount

/** That saving as a whole-number percentage. */
export const ANNUAL_SAVING_PCT = Math.round(
  (ANNUAL_SAVING / (PLANS.monthly.amount * 12)) * 100
)

/** Formats pence as pounds, hiding ".00" on whole amounts. */
export function formatPrice(pence: number): string {
  const pounds = pence / 100
  return `£${pounds % 1 === 0 ? pounds.toFixed(0) : pounds.toFixed(2)}`
}

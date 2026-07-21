import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
})

export const PLANS = {
  student_pro: {
    priceId: process.env.STRIPE_STUDENT_PRO_PRICE_ID!,
    name: "Student Pro",
    amount: 1999,
  },
} as const

export type PlanKey = keyof typeof PLANS

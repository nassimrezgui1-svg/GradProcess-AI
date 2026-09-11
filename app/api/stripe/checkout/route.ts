import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getStripe, priceIdFor } from "@/lib/stripe"
import { isPlanKey } from "@/lib/plans"

export async function POST(req: Request) {
  try {
    // Check configuration before anything else, and name what is missing.
    // Building the client inside the main try block turned an unset key into a
    // bare "Internal server error", which says nothing about the cause.
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("[stripe/checkout] STRIPE_SECRET_KEY is not set in this environment")
      return NextResponse.json(
        { error: "Payments are not configured yet. Please try again shortly." },
        { status: 503 }
      )
    }

    const stripe = getStripe()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { plan = "monthly", promoCode, successUrl, cancelUrl } = await req.json()

    if (!isPlanKey(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }
    const priceId = priceIdFor(plan)

    // A missing Price ID means the environment was never configured. Say so
    // plainly rather than letting Stripe reject an empty price.
    if (!priceId) {
      console.error(`[stripe/checkout] no Price ID configured for the ${plan} plan`)
      return NextResponse.json(
        { error: "This plan is not available yet. Please try again later." },
        { status: 503 }
      )
    }

    // Get or create Stripe customer
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single()

    let customerId = sub?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id

      const { error: upsertError } = await supabase
        .from("subscriptions")
        .upsert({ user_id: user.id, stripe_customer_id: customerId }, { onConflict: "user_id" })
      if (upsertError) console.error("[stripe/checkout] failed to store customer id", upsertError.message)
    }

    // Fall back to the request origin so redirects work even if NEXT_PUBLIC_APP_URL is unset
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin

    // A code arriving from our own pricing page is pre-applied so the discount
    // is visible before the card is entered. Stripe rejects `discounts` and
    // `allow_promotion_codes` together, so it is one or the other: pre-applied
    // when we resolved a code, otherwise the manual entry box.
    const discount = await resolvePromotionCode(stripe, promoCode)

    const baseParams = {
      customer: customerId,
      mode: "subscription" as const,
      payment_method_types: ["card" as const],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl ?? `${appUrl}/dashboard?checkout=success`,
      cancel_url: cancelUrl ?? `${appUrl}/pricing?checkout=cancelled`,
      subscription_data: {
        metadata: { supabase_user_id: user.id, plan_key: plan },
      },
      metadata: { supabase_user_id: user.id, plan_key: plan },
    }

    try {
      const session = await stripe.checkout.sessions.create({
        ...baseParams,
        ...(discount
          ? { discounts: [{ promotion_code: discount }] }
          : { allow_promotion_codes: true }),
      })
      return NextResponse.json({ url: session.url })
    } catch (err) {
      // A code restricted to another plan (our half-price code is monthly-only)
      // makes Stripe reject the whole session. Tell the customer which plan the
      // code is for instead of failing with a generic error.
      if (discount && isCouponNotApplicable(err)) {
        return NextResponse.json(
          {
            error:
              "That discount code doesn't apply to this plan. It's valid on the monthly subscription — switch to monthly, or clear the code to continue.",
          },
          { status: 400 }
        )
      }
      throw err
    }
  } catch (err) {
    console.error("[stripe/checkout]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/** True when Stripe refused the session because the coupon matched nothing in it. */
function isCouponNotApplicable(err: unknown): boolean {
  const message = (err as { message?: string })?.message ?? ""
  return /coupon|promotion code/i.test(message) && /cannot be redeemed|does not apply|not applicable/i.test(message)
}

/**
 * Looks up an active promotion code by its customer-facing string.
 * Returns the promotion code ID, or null so checkout falls back to letting the
 * customer type a code themselves. An unknown or expired code must never block
 * the purchase.
 */
async function resolvePromotionCode(
  stripe: ReturnType<typeof getStripe>,
  code: unknown
): Promise<string | null> {
  if (typeof code !== "string" || !code.trim()) return null
  try {
    const { data } = await stripe.promotionCodes.list({
      code: code.trim(),
      active: true,
      limit: 1,
    })
    return data[0]?.id ?? null
  } catch (err) {
    console.error("[stripe/checkout] promotion code lookup failed", err)
    return null
  }
}

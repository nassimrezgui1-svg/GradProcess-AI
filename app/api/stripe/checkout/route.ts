import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getStripe, PLANS } from "@/lib/stripe"

export async function POST(req: Request) {
  try {
    const stripe = getStripe()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { plan = "student_pro", successUrl, cancelUrl } = await req.json()
    const planConfig = PLANS[plan as keyof typeof PLANS]

    if (!planConfig) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
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

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      success_url: successUrl ?? `${appUrl}/dashboard?checkout=success`,
      cancel_url: cancelUrl ?? `${appUrl}/pricing?checkout=cancelled`,
      subscription_data: {
        metadata: { supabase_user_id: user.id },
      },
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error("[stripe/checkout]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

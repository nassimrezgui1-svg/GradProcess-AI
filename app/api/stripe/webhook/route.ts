import { NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { createClient } from "@supabase/supabase-js"
import type Stripe from "stripe"

// Service role client — bypasses RLS for webhook writes
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")!

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error("[webhook] signature verification failed", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = getServiceClient()

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.supabase_user_id
      if (!userId) break

      const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end

      // Read the interval off the subscription itself rather than trusting
      // metadata, so a plan switched inside Stripe's billing portal is still
      // recorded correctly.
      const interval = sub.items?.data?.[0]?.price?.recurring?.interval ?? null

      // Everything we know about the subscription.
      const full = {
        user_id: userId,
        stripe_customer_id: sub.customer as string,
        stripe_subscription_id: sub.id,
        plan: "pro",
        billing_interval: interval === "year" ? "year" : interval === "month" ? "month" : null,
        status: sub.status,
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        cancel_at_period_end: sub.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from("subscriptions")
        .upsert(full, { onConflict: "user_id" })

      if (error) {
        // A customer has paid. If the full write is refused — a CHECK
        // constraint on plan once did exactly this, leaving a paying customer
        // locked out — fall back to the fields that actually grant access.
        // Better a row missing its descriptive columns than a paid account
        // that cannot get in.
        console.error("[webhook] subscriptions upsert failed:", error.message, "— retrying with access fields only")

        const { error: retryError } = await supabase
          .from("subscriptions")
          .upsert({
            user_id: userId,
            stripe_customer_id: full.stripe_customer_id,
            stripe_subscription_id: full.stripe_subscription_id,
            status: full.status,
            current_period_end: full.current_period_end,
            cancel_at_period_end: full.cancel_at_period_end,
            updated_at: full.updated_at,
          }, { onConflict: "user_id" })

        if (retryError) {
          // Both writes failed: the customer is paying and cannot get in.
          // Return non-2xx so Stripe retries this event automatically.
          console.error("[webhook] CRITICAL: paid subscription could not be recorded for", userId, retryError.message)
          return NextResponse.json({ error: "Could not record subscription" }, { status: 500 })
        }
      }

      // Descriptive only — never allow it to affect whether access was granted.
      if (sub.status === "active") {
        const { error: profileError } = await supabase
          .from("user_profiles")
          .update({ plan: "pro" })
          .eq("user_id", userId)
        if (profileError) console.error("[webhook] user_profiles plan sync failed:", profileError.message)
      }
      break
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.supabase_user_id
      if (!userId) break

      const { error } = await supabase.from("subscriptions").upsert({
        user_id: userId,
        stripe_subscription_id: sub.id,
        plan: "free",
        billing_interval: null,
        status: "cancelled",
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" })
      if (error) console.error("[webhook] subscriptions upsert failed", error.message)

      await supabase.from("user_profiles").update({ plan: "free" }).eq("user_id", userId)
      break
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice
      const subId = (invoice as any).subscription as string
      if (!subId) break

      await supabase
        .from("subscriptions")
        .update({ status: "past_due", updated_at: new Date().toISOString() })
        .eq("stripe_subscription_id", subId)
      break
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice
      const subId = (invoice as any).subscription as string
      if (!subId) break

      await supabase
        .from("subscriptions")
        .update({ status: "active", updated_at: new Date().toISOString() })
        .eq("stripe_subscription_id", subId)
      break
    }
  }

  return NextResponse.json({ received: true })
}

import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"

/**
 * Deletes the signed-in user's account and everything belonging to them.
 *
 * Settings offered a Delete Account button that called this path, but the route
 * did not exist. The client never checked the response, so a user typed DELETE,
 * was signed out and shown a confirmation, and their account and all their data
 * remained. The privacy policy meanwhile promised "delete your account and all
 * associated data" and "personal data purged within 30 days" — a right to
 * erasure under UK GDPR, not a feature.
 *
 * Every table carrying user data declares ON DELETE CASCADE against
 * auth.users, and audit_logs declares ON DELETE SET NULL, so removing the auth
 * user removes the personal data and anonymises the audit trail — which is what
 * the privacy policy describes.
 *
 * Order matters. Everything that can fail harmlessly runs before anything
 * destructive, so a failure never leaves a half-deleted account:
 *   1. confirm who is asking
 *   2. cancel billing, so a deleted account is never charged again
 *   3. delete the user, which cascades
 */
export async function DELETE() {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    // 1. Only ever delete the account making the request.
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 })
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("account delete: SUPABASE_SERVICE_ROLE_KEY is not configured")
      return NextResponse.json(
        { error: "Account deletion is not available right now. Please contact support." },
        { status: 503 }
      )
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 2. Cancel billing before destroying anything. Deleting the account while
    //    a subscription stays live would keep charging a customer who no longer
    //    has one.
    const { data: sub } = await admin
      .from("subscriptions")
      .select("stripe_subscription_id")
      .eq("user_id", user.id)
      .maybeSingle()

    if (sub?.stripe_subscription_id && process.env.STRIPE_SECRET_KEY) {
      try {
        await getStripe().subscriptions.cancel(sub.stripe_subscription_id)
      } catch (err: any) {
        // Already cancelled or missing at Stripe is fine — anything else is not,
        // because it would leave a deleted account still being billed.
        const code = err?.code ?? err?.raw?.code
        const missing = err?.statusCode === 404 || code === "resource_missing"
        if (!missing) {
          console.error("account delete: could not cancel subscription", err)
          return NextResponse.json(
            { error: "We could not cancel your subscription, so nothing was deleted. Please contact support." },
            { status: 502 }
          )
        }
      }
    }

    // 3. Destructive step last. Cascades remove the user's rows across every
    //    table and null their audit log entries.
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
    if (deleteError) {
      console.error("account delete: deleteUser failed", deleteError)
      return NextResponse.json(
        { error: "Your account could not be deleted. Please contact support." },
        { status: 500 }
      )
    }

    return NextResponse.json({ deleted: true })
  } catch (err: any) {
    console.error("account delete: unexpected failure", err)
    return NextResponse.json(
      { error: "Your account could not be deleted. Please contact support." },
      { status: 500 }
    )
  }
}

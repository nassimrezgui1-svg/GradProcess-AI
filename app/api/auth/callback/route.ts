import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { hasProductAccess, PAYWALL_REDIRECT } from "@/lib/access"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  // Handle OAuth errors (e.g. user cancelled)
  if (error) {
    console.error("OAuth error:", error, errorDescription)
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
  }

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      // Ensure redirect stays on the same origin
      let safeNext = next.startsWith("/") ? next : "/dashboard"

      if (safeNext === "/dashboard") {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const [{ data: profile }, { data: sub }] = await Promise.all([
            supabase
              .from("user_profiles")
              .select("onboarding_complete, target_sector, target_role")
              .eq("user_id", user.id)
              .maybeSingle(),
            supabase
              .from("subscriptions")
              .select("status")
              .eq("user_id", user.id)
              .maybeSingle(),
          ])

          if (!hasProductAccess(sub?.status)) {
            // Unpaid: go straight to pricing. Sending them through onboarding
            // first would spend their effort on a product they cannot open.
            safeNext = PAYWALL_REDIRECT
          } else {
            // Paid: first arrival goes to onboarding when no target is set, so
            // the modules have something to personalise from.
            const unstarted =
              !profile?.onboarding_complete && !profile?.target_sector && !profile?.target_role
            if (unstarted) safeNext = "/onboarding"
          }
        }
      }

      return NextResponse.redirect(`${origin}${safeNext}`)
    }

    console.error("Code exchange error:", exchangeError.message)
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}

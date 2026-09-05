import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

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

      // First arrival (email confirmation or Google sign-in) goes to onboarding
      // when the profile has no target set. Those questions were previously
      // unreachable, so every account started blank and nothing personalised.
      if (safeNext === "/dashboard") {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("onboarding_complete, target_sector, target_role")
            .eq("user_id", user.id)
            .maybeSingle()

          const unstarted =
            !profile?.onboarding_complete && !profile?.target_sector && !profile?.target_role
          if (unstarted) safeNext = "/onboarding"
        }
      }

      return NextResponse.redirect(`${origin}${safeNext}`)
    }

    console.error("Code exchange error:", exchangeError.message)
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}

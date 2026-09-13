import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { hasProductAccess } from "@/lib/access"
import { limits, rateLimitResponse } from "@/lib/security/rateLimit"

/**
 * Guards a paid API route.
 *
 * The paywall in proxy.ts only ever inspected page paths — PROTECTED_PATHS is a
 * list of pages, so `isProtected("/api/ai/generate-star")` was false and the
 * proxy returned before any check ran. Every AI endpoint was therefore open to
 * the internet: a plain curl with no account, no subscription and no cookie
 * returned a complete STAR answer from production. The endpoints are readable
 * in the client bundle, so this was the whole paid product available for free,
 * billed to the project's Anthropic account.
 *
 * The rules here are deliberately the same ones the pages use, from
 * lib/access.ts, so a user who can reach a page can use the API behind it and
 * no one else can.
 */
// NextResponse extends Response, and the rate limiter returns a plain Response,
// so the wider type catches both.
export type Guarded = { userId: string } | Response

export function isBlocked(result: Guarded): result is Response {
  return result instanceof Response
}

export async function requirePaidUser(): Promise<Guarded> {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try { cookieStore.set(name, value, options) } catch { /* read-only in a route handler */ }
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Please sign in to use this." }, { status: 401 })
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle()

  // Same rule as the pages: unknown or missing status grants nothing.
  if (!hasProductAccess(sub?.status)) {
    return NextResponse.json(
      { error: "This needs an active subscription." },
      { status: 402 }
    )
  }

  // Per-user ceiling. Generation is the most expensive thing the product does,
  // and nothing throttled it: the project's Anthropic balance was exhausted
  // once already, which takes every AI feature down for everyone at once.
  const limit = limits.aiCall(user.id)
  if (!limit.allowed) return rateLimitResponse(limit)

  return { userId: user.id }
}

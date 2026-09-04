import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

const PROTECTED_PATHS = [
  "/dashboard",
  "/cv-tailor",
  "/cv-tailoring",
  "/star-builder",
  "/video-interview",
  "/psychometric",
  "/industry",
  "/industry-hub",
  "/interview",
  "/coach",
  "/reports",
  "/analytics",
  "/simulator",
  "/tracker",
  "/settings",
  "/billing",
]

function isProtected(pathname: string) {
  return PROTECTED_PATHS.some(p => pathname === p || pathname.startsWith(p + "/"))
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const response = NextResponse.next({ request })
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")

  if (!isProtected(pathname)) return response

  // In development, bypass all auth/subscription checks
  if (process.env.NODE_ENV === "development") return response

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Production: enforce active subscription (allow /billing to manage plan)
  if (!pathname.startsWith("/billing")) {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .single()

    const isActive = sub?.status === "active" || sub?.status === "trialing"
    if (!isActive) {
      return NextResponse.redirect(new URL("/pricing?gate=1", request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets|api/stripe/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

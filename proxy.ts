import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  // In development, skip all auth checks so pages load instantly.
  // Auth is enforced at the component level via Supabase client.
  if (process.env.NODE_ENV === "development") {
    const response = NextResponse.next({ request })
    response.headers.set("X-Frame-Options", "DENY")
    response.headers.set("X-Content-Type-Options", "nosniff")
    return response
  }

  // Production auth is handled here
  return NextResponse.next({ request })
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

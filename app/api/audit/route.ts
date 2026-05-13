import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"

const auditSchema = z.object({
  action: z.string().min(1).max(100),
  resourceType: z.string().max(100).optional(),
  resourceId: z.string().max(200).optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = auditSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

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

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown"

    const { error } = await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: parsed.data.action,
      resource_type: parsed.data.resourceType ?? null,
      resource_id: parsed.data.resourceId ?? null,
      metadata: parsed.data.metadata ?? null,
      ip_address: ip,
      user_agent: request.headers.get("user-agent") ?? null,
    })

    if (error) {
      // Silently fail — audit log errors must never break user flows
      console.error("Audit log insert error:", error.message)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Audit route error:", err)
    // Always return 200 so client-side logAuditEvent() never throws
    return NextResponse.json({ ok: true })
  }
}

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
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

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch all user data in parallel
    const [
      { data: profile },
      { data: applications },
      { data: sessions },
      { data: cvScans },
      { data: starStories },
    ] = await Promise.all([
      supabase.from("user_settings").select("*").eq("user_id", user.id).single(),
      supabase.from("applications").select("*").eq("user_id", user.id),
      supabase.from("interview_sessions").select("id, created_at, question, stage, score, feedback_summary").eq("user_id", user.id),
      supabase.from("cv_scans").select("id, created_at, score, keywords_found, keywords_missing").eq("user_id", user.id),
      supabase.from("star_stories").select("*").eq("user_id", user.id),
    ])

    const exportData = {
      exportedAt: new Date().toISOString(),
      account: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
      },
      profile: profile ?? {},
      applications: applications ?? [],
      interviewSessions: sessions ?? [],
      cvScans: cvScans ?? [],
      starStories: starStories ?? [],
    }

    const json = JSON.stringify(exportData, null, 2)

    return new Response(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="gradprocess-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    })
  } catch (err) {
    console.error("Export error:", err)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}

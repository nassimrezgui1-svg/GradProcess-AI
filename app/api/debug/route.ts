import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    hasGradprocessKey: !!process.env.GRADPROCESS_AI_KEY,
    keyPrefix: process.env.GRADPROCESS_AI_KEY?.substring(0, 15) || "NOT SET",
    testVar: process.env.TEST_VAR || "NOT SET",
    nodeEnv: process.env.NODE_ENV,
    allKeys: Object.keys(process.env).filter(k => k.includes("GRADPROCESS") || k.includes("TEST") || k.includes("SUPABASE")),
  })
}

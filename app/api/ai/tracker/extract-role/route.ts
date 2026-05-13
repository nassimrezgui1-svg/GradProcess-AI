import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

const client = new Anthropic({ apiKey: process.env.GRADPROCESS_AI_KEY })

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()
    if (!text || text.trim().length < 30) {
      return NextResponse.json({ error: "Job description too short" }, { status: 400 })
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: [
        {
          type: "text",
          text: "You are an expert at parsing graduate job descriptions. Extract structured data accurately. Return ONLY valid JSON with no markdown code fences.",
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `Extract information from this job description. Return ONLY this JSON:

{
  "company": "<company name, infer if not explicit>",
  "role": "<exact job title>",
  "sector": "<one of: Banking, Investment Banking, Consulting, Asset Management, Wealth Management, Insurance, Technology, Law, Engineering, FMCG, Energy, Healthcare, Public Sector, Other>",
  "department": "<department or team if mentioned, else null>",
  "location": "<city/country, null if not found>",
  "workType": "<Remote|Hybrid|On-site|null>",
  "salary": "<salary range as string, null if not found>",
  "deadline": "<application deadline as YYYY-MM-DD, null if not found>",
  "skills": [<array of 6-8 technical skills/tools required>],
  "softSkills": [<array of 4-6 soft skills or competencies>],
  "responsibilities": [<array of 5-7 key responsibilities>],
  "requirements": [<array of 4-6 core requirements or qualifications>]
}

Job Description:
${text.slice(0, 4000)}`,
        },
      ],
    })

    const raw = response.content[0].type === "text" ? response.content[0].text : ""
    const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim()
    const result = JSON.parse(clean)
    return NextResponse.json(result)
  } catch (err: any) {
    console.error("extract-role error:", err)
    return NextResponse.json({ error: err.message || "Extraction failed" }, { status: 500 })
  }
}

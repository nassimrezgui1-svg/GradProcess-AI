import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const client = new Anthropic({ apiKey: process.env.GRADPROCESS_AI_KEY })
  try {
    const { scores, targetRole, targetSector, targetCompanies } = await req.json()

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: [
        {
          type: "text",
          text: `You are a senior graduate recruitment coach providing personalised readiness reports. Be honest, specific, and motivating. Respond with valid JSON only — no markdown, no code blocks.`,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `Generate a personalised readiness report.

Target Role: ${targetRole || "Graduate Analyst"}
Target Sector: ${targetSector || "Financial Services"}
Target Companies: ${targetCompanies?.join(", ") || "Top graduate employers"}

Scores:
- CV/ATS: ${scores?.cv || 0}/100
- STAR: ${scores?.star || 0}/100
- Video Interview: ${scores?.videoInterview || 0}/100
- Psychometric: ${scores?.psychometric || 0}/100
- Industry Knowledge: ${scores?.industryKnowledge || 0}/100
- Full Process Exam: ${scores?.fullProcessExam || 0}/100
- Overall: ${scores?.overall || 0}/100

Return ONLY this JSON:
{
  "overallAssessment": "<2-3 sentence honest assessment of current readiness>",
  "readinessVerdict": "<Apply Now | Keep Preparing | Not Ready Yet>",
  "strongestArea": "<best module and why it matters>",
  "weakestArea": "<weakest module and its impact on applications>",
  "priorityActions": [
    {
      "action": "<specific action>",
      "impact": "<why this improves chances>",
      "timeframe": "<e.g. 1 week>"
    }
  ],
  "weeklyPlan": [
    { "week": 1, "focus": "<focus area>", "tasks": ["<task 1>", "<task 2>", "<task 3>"] },
    { "week": 2, "focus": "<focus area>", "tasks": ["<task 1>", "<task 2>", "<task 3>"] },
    { "week": 3, "focus": "<focus area>", "tasks": ["<task 1>", "<task 2>", "<task 3>"] },
    { "week": 4, "focus": "<focus area>", "tasks": ["<task 1>", "<task 2>", "<task 3>"] }
  ],
  "applicationAdvice": "<specific advice on when and how to start applying>"
}`,
        },
      ],
    })

    const raw = response.content[0].type === "text" ? response.content[0].text : ""
    // Strip markdown code fences if Claude wraps the response
    const text = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim()
    const result = JSON.parse(text)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Readiness report error:", error)
    return NextResponse.json({ error: error.message || "Generation failed" }, { status: 500 })
  }
}

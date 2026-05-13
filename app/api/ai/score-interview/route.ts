import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const client = new Anthropic({ apiKey: process.env.GRADPROCESS_AI_KEY })
  try {
    const { question, transcript, sector, role, questionType } = await req.json()

    if (!question || !transcript) {
      return NextResponse.json({ error: "Question and transcript are required" }, { status: 400 })
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: [
        {
          type: "text",
          text: `You are a senior graduate recruitment assessor who scores video interview answers for top firms. Be honest, specific and constructive. Respond with valid JSON only — no markdown, no code blocks.`,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `Score this interview answer transcript.

Question: ${question}
Question type: ${questionType || "competency"}
Sector: ${sector || "Financial Services"}
Role: ${role || "Graduate Analyst"}

Candidate's answer:
"${transcript}"

Return ONLY this JSON:
{
  "overallScore": <number 0-100>,
  "contentScore": <number 0-100>,
  "deliveryScore": <number 0-100, estimated from transcript clarity and structure>,
  "starScore": <number 0-100, STAR structure quality if applicable>,
  "commercialAwarenessScore": <number 0-100>,
  "roleFitScore": <number 0-100>,
  "confidenceScore": <number 0-100, inferred from language strength>,
  "strengths": [<2-3 specific things they did well>],
  "improvements": [<3-5 specific actionable improvements>],
  "missedOpportunities": [<things they could have mentioned but didn't>],
  "modelAnswer": "<model answer for this question, 150-200 words>",
  "rewrittenAnswer": "<their answer rewritten stronger, keeping their examples>"
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
    console.error("Interview scoring error:", error)
    return NextResponse.json({ error: error.message || "Scoring failed" }, { status: 500 })
  }
}

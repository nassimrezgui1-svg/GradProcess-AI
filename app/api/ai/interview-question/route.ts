import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const client = new Anthropic({ apiKey: process.env.GRADPROCESS_AI_KEY })
  try {
    const { sector, role, mode, previousQuestions = [] } = await req.json()

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      system: [
        {
          type: "text",
          text: `You are an experienced graduate recruiter conducting video interviews for top firms. Generate realistic interview questions. Respond with valid JSON only — no markdown, no code blocks.`,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `Generate ONE interview question for:
Sector: ${sector || "Financial Services"}
Role: ${role || "Graduate Analyst"}
Interview mode: ${mode || "competency"}
Previously asked (do not repeat): ${previousQuestions.join(", ") || "none"}

Mode guide:
- competency: "Tell me about a time you..." behavioural questions
- strengths: Strengths-based questions about what energises them
- motivational: Why this firm/sector/role questions
- technical: Sector-specific knowledge questions
- commercial: Current affairs, market trends, business awareness
- mixed: Any of the above

Return ONLY this JSON:
{
  "question": "<the interview question>",
  "type": "<competency|strengths|motivational|technical|commercial>",
  "hint": "<brief coaching tip on what a strong answer includes, 1 sentence>",
  "timeLimit": <suggested answer time in seconds, 60-180>
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
    console.error("Question generation error:", error)
    return NextResponse.json({ error: error.message || "Generation failed" }, { status: 500 })
  }
}

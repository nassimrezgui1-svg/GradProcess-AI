import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const client = new Anthropic({ apiKey: process.env.GRADPROCESS_AI_KEY })
  try {
    const { cv, competency, targetRole, targetSector } = await req.json()

    if (!competency) {
      return NextResponse.json({ error: "Competency is required" }, { status: 400 })
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: [
        {
          type: "text",
          text: `You are an expert graduate recruitment coach specialising in competency-based interviews and STAR methodology. You extract real experiences from CVs and craft compelling STAR answers. Respond with valid JSON only — no markdown, no code blocks.`,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `Generate a detailed STAR interview answer for the competency "${competency}".

CV:
${cv || "No CV provided — generate a realistic example for a finance/consulting graduate candidate"}

Target Role: ${targetRole || "Graduate Analyst"}
Target Sector: ${targetSector || "Financial Services"}

Return ONLY this JSON:
{
  "score": <number 0-100>,
  "starCompleteness": <number 0-100>,
  "competency": "${competency}",
  "situation": "<2-3 sentences: who, where, when, context>",
  "task": "<1-2 sentences: specific responsibility or challenge>",
  "action": "<3-5 sentences: specific actions THEY personally took — use 'I' not 'we'>",
  "result": "<2-3 sentences: quantified outcomes and impact>",
  "improvedVersion": "<full rewritten STAR answer, 200-250 words, strong language, quantified, first person>",
  "version60s": "<60-second spoken version, ~150 words, punchy>",
  "version90s": "<90-second spoken version, ~225 words>",
  "version2min": "<2-minute spoken version, ~300 words, full detail with reflection>",
  "improvements": [<3-5 specific improvements to strengthen this answer>],
  "missingElements": [<elements missing that interviewers will notice>],
  "followUpQuestions": [<3 follow-up questions an interviewer will likely ask>],
  "interviewerRiskFlags": [<things that could concern an interviewer>]
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
    console.error("STAR generation error:", error)
    return NextResponse.json({ error: error.message || "Generation failed" }, { status: 500 })
  }
}

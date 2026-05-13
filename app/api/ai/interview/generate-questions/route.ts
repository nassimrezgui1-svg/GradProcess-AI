import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

const client = new Anthropic({ apiKey: process.env.GRADPROCESS_AI_KEY })

export async function POST(req: NextRequest) {
  try {
    const { setup } = await req.json()
    const { sector, role, mode, difficulty, questionCount } = setup

    const prompt = `You are an expert graduate recruitment interviewer at a top ${sector} firm.

Generate exactly ${questionCount} interview questions for a ${difficulty}-level ${mode} interview for a ${role} role in ${sector}.

Rules:
- Questions must be genuinely varied — no two questions the same structure
- Tailor specifically to ${sector} and ${role}
- ${difficulty === "Elite" || difficulty === "Assessment Centre" ? "Include pressure questions and follow-up probing" : "Questions appropriate for " + difficulty + " level"}
- For competency/behavioral questions, they must be open-ended STAR-format prompts
- For technical questions, they must be genuinely testable knowledge questions for ${sector}
- For commercial questions, they must require real industry knowledge

Return ONLY valid JSON — an array of objects with exactly these fields:
{
  "id": "q1",
  "text": "the full question text",
  "type": "${mode === "Mixed" ? "one of: Competency, Strengths, Motivational, Technical, Commercial" : mode}",
  "competency": "the competency being tested e.g. Leadership, Teamwork, Commercial Awareness",
  "hint": "a 1-line coaching hint for the student e.g. Use STAR structure, focus on your personal contribution",
  "suggestedSeconds": 120,
  "isFollowUp": false
}

Generate exactly ${questionCount} questions.`

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    })

    const text = response.content[0].type === "text" ? response.content[0].text : "[]"
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    const questions = JSON.parse(jsonMatch?.[0] || "[]")

    return NextResponse.json({ questions })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

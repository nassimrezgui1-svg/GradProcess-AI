import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const client = new Anthropic({ apiKey: process.env.GRADPROCESS_AI_KEY })
  try {
    const { sector, topic } = await req.json()

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: [
        {
          type: "text",
          text: `You are a senior industry expert and graduate recruitment coach providing accurate sector knowledge to graduates preparing for interviews. Knowledge current to 2025. Respond with valid JSON only — no markdown, no code blocks.`,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `Generate commercial awareness content for a graduate preparing for ${sector} interviews.
Topic: ${topic || "current trends and themes"}

Return ONLY this JSON:
{
  "sector": "${sector}",
  "topic": "${topic || "current trends"}",
  "keyPoints": [<5-7 key points a graduate should know>],
  "interviewTalkingPoints": [<3-4 ways to bring this up naturally in an interview>],
  "sampleQuestion": "<a likely interview question on this topic>",
  "strongAnswer": "<100-word model answer to that question>",
  "datPoints": [<3-4 specific statistics or facts to quote>],
  "watchOut": "<one common mistake graduates make when discussing this topic>"
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
    console.error("Sector insight error:", error)
    return NextResponse.json({ error: error.message || "Generation failed" }, { status: 500 })
  }
}

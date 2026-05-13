import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const client = new Anthropic({ apiKey: process.env.GRADPROCESS_AI_KEY })
  try {
    const { type, difficulty = "medium", count = 20, previousQuestions = [] } = await req.json()

    const topicGuide: Record<string, string> = {
      numerical: "percentages, ratios, growth rates, charts/tables, profit/loss, interest rates, currency conversion, averages, breakeven, market data — use realistic financial services / consulting context with specific numbers",
      verbal: "true/false/cannot say based on passages about business topics — banking regulation, consulting strategy, technology trends, ESG, corporate finance. Each question needs a fresh passage.",
      logical: "number sequences, letter sequences, matrix patterns, syllogisms, deductive reasoning, odd one out — vary the pattern type across questions",
      abstract: "shape sequences, visual pattern completion, rotation problems, odd one out — describe the pattern in words since this is text-based",
      sjt: "realistic workplace scenarios for a graduate analyst at a bank or consulting firm — professionalism, teamwork, ethics, client handling, escalation decisions, time pressure",
      attention: "data checking (spot differences between two data sets), proofreading business emails/reports (spot errors), exact matching of figures, error spotting in financial tables",
    }

    const avoidSection = previousQuestions.length > 0
      ? `\nIMPORTANT: Do NOT repeat or closely resemble any of these previously asked questions:\n${previousQuestions.slice(0, 20).map((q: string, i: number) => `${i + 1}. ${q}`).join("\n")}\n`
      : ""

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      system: [
        {
          type: "text",
          text: `You are an expert psychometric test designer creating graduate recruitment assessment questions used by top banks and consulting firms. All questions must be original, properly calibrated for graduate level, and use realistic contexts. Never repeat question patterns. Respond with valid JSON only — no markdown, no code blocks.`,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `Generate exactly ${count} ${type} reasoning questions at ${difficulty} difficulty. Make them varied — different topics, different structures, different difficulty within the band.

Topics and style: ${topicGuide[type] || "general reasoning"}

${type === "verbal" ? "For verbal: each question needs its own unique passage (80-120 words) on a different business topic, then ask True/False/Cannot Say about a specific statement." : ""}
${type === "sjt" ? "For SJT: each scenario should be a different workplace situation. Provide 4 response options labelled A-D. The correct answer is the most professionally appropriate response." : ""}
${type === "attention" ? "For attention to detail: mix question styles — spot the difference in figures, find the error in a passage, identify the mismatched data." : ""}
${avoidSection}

Return ONLY this JSON (no markdown, no explanation):
{
  "questions": [
    {
      "id": "q1",
      "type": "${type}",
      "difficulty": "${difficulty}",
      "passage": "<for verbal only — unique passage for this question, omit this field for other types>",
      "question": "<the full question text>",
      "options": ["<option A text>", "<option B text>", "<option C text>", "<option D text>"],
      "correct": <0, 1, 2 or 3>,
      "explanation": "<clear explanation of the correct answer — show full working for numerical questions>",
      "timeLimit": <recommended seconds to answer, 45-90 for easy, 75-120 for hard>
    }
  ]
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
    console.error("Psychometric quiz error:", error)
    return NextResponse.json({ error: error.message || "Generation failed" }, { status: 500 })
  }
}

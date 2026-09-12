import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

// Vercel terminates the function at this ceiling instead of letting a slow
// model hold the request open indefinitely. Hobby plan allows up to 60s.
export const maxDuration = 60

/**
 * All twenty questions used to come from one 8,000-token request — the largest
 * call in the app, since every question carries four options and a fully worked
 * explanation. It consistently ran past the 60s ceiling: a 12 September audit
 * recorded 0 of 3 attempts succeeding, each failing after 45-60s, on a feature
 * sold as an included Student Pro benefit.
 *
 * Measured against the real prompt: 20 in one call exceeds 60s; batches of 10
 * still reached 60.6s for verbal, which carries a fresh passage per question.
 * Batches of 4 at 2,600 tokens leave the slowest run inside the ceiling and
 * give numerical questions room for their full worked explanations — at 2,200
 * those were truncated mid-JSON, and the failed batches silently shrank a
 * 20-question test to 10.
 */
const BATCH_SIZE = 4

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

    // Batches run concurrently and cannot see each other, so without this each
    // one drew from the same topic list and produced overlapping questions —
    // dedupe then left a 20-question test with only 15 in it.
    const allTopics = (topicGuide[type] || "general reasoning").split(",").map(s => s.trim()).filter(Boolean)
    function topicsFor(batchIndex: number, batchTotal: number) {
      if (allTopics.length <= batchTotal) return allTopics.join(", ")
      const per = Math.ceil(allTopics.length / batchTotal)
      const slice = allTopics.slice(batchIndex * per, batchIndex * per + per)
      return (slice.length ? slice : allTopics).join(", ")
    }

    async function generateBatch(batchCount: number, focusTopics: string) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2600,
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
          content: `Generate exactly ${batchCount} ${type} reasoning questions at ${difficulty} difficulty. Make them varied — different topics, different structures, different difficulty within the band.

Topics and style: ${focusTopics}\n\nStay within those topics for this set so it does not overlap other sets.

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
      "correct": <MUST vary across all questions — use 0, 1, 2 AND 3 roughly equally, do NOT default to 1>,
      "explanation": "<clear explanation of the correct answer, at most 60 words. For numerical, show the working as a compact calculation rather than prose — unbounded explanations truncate the response mid-JSON and lose the whole batch>",
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
      const parsed = JSON.parse(text)
      if (!Array.isArray(parsed.questions)) {
        throw new Error("Model returned no questions array")
      }
      return parsed.questions
    }

    // Concurrent, so the wall-clock cost is the slowest batch rather than the
    // sum. Batches cannot see each other, so near-duplicates are removed below.
    // Two spare batches, because near-duplicates are dropped when the batches
    // are merged and the UI promises an exact count ("Start Practice (20 Qs)").
    // With one spare, logical and attention still came back with 18-19.
    const target = count + BATCH_SIZE * 2
    const batchSizes: number[] = []
    for (let remaining = target; remaining > 0; remaining -= BATCH_SIZE) {
      batchSizes.push(Math.min(BATCH_SIZE, remaining))
    }
    // One failed batch should not lose the whole test, but a total failure has
    // to surface: returning { questions: [] } with a 200 left the page showing
    // a test with nothing in it.
    const settled = await Promise.allSettled(
      batchSizes.map((n, i) => generateBatch(n, topicsFor(i, batchSizes.length)))
    )
    const batches = settled.flatMap(r => (r.status === "fulfilled" ? [r.value] : []))
    if (batches.length === 0) {
      const reason = settled.find(r => r.status === "rejected") as PromiseRejectedResult | undefined
      throw new Error(reason?.reason?.message || "Question generation failed")
    }

    const seen = new Set<string>()
    const merged: any[] = []
    for (const q of batches.flat()) {
      const key = String(q?.question ?? "").toLowerCase().replace(/\s+/g, " ").trim()
      if (!key || seen.has(key)) continue
      seen.add(key)
      merged.push({ ...q, id: `q${merged.length + 1}` })
    }
    if (merged.length === 0) {
      return NextResponse.json(
        { error: "No questions could be generated. Please try again." },
        { status: 502 }
      )
    }
    const result: any = { questions: merged.slice(0, count) }

    // Shuffle options server-side to remove LLM position bias (answers cluster at index 1)
    // Fisher-Yates shuffle on each question's options, keeping correct answer tracked by content
    if (Array.isArray(result.questions)) {
      result.questions = result.questions.map((q: any) => {
        if (!Array.isArray(q.options) || typeof q.correct !== "number") return q
        const correctText = q.options[q.correct]
        // Fisher-Yates
        const shuffled = [...q.options]
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        return { ...q, options: shuffled, correct: shuffled.indexOf(correctText) }
      })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Psychometric quiz error:", error)
    return NextResponse.json({ error: error.message || "Generation failed" }, { status: 500 })
  }
}

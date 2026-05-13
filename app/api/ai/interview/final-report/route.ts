import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

const client = new Anthropic({ apiKey: process.env.GRADPROCESS_AI_KEY })

export async function POST(req: NextRequest) {
  try {
    const { setup, questions, answers, sessionId } = await req.json()

    const summaries = answers.map((a: any, i: number) =>
      `Q${i + 1}: "${questions[i]?.text}" — Overall: ${a.overallScore}/100, STAR: ${a.starScore}/100, Content: ${a.contentScore}/100, Fillers: ${a.fillerWords?.total || 0}`
    ).join("\n")

    const totalFillers = answers.reduce((sum: number, a: any) => sum + (a.fillerWords?.total || 0), 0)
    const avgWpm = Math.round(answers.reduce((sum: number, a: any) => sum + (a.delivery?.wordsPerMinute || 0), 0) / Math.max(answers.length, 1))
    const totalDuration = answers.reduce((sum: number, a: any) => sum + (a.durationSeconds || 0), 0)
    const avgContent = Math.round(answers.reduce((sum: number, a: any) => sum + (a.contentScore || 0), 0) / Math.max(answers.length, 1))
    const avgStar = Math.round(answers.reduce((sum: number, a: any) => sum + (a.starScore || 0), 0) / Math.max(answers.length, 1))
    const avgDelivery = Math.round(answers.reduce((sum: number, a: any) => sum + (a.deliveryScore || 0), 0) / Math.max(answers.length, 1))
    const avgCommercial = Math.round(answers.reduce((sum: number, a: any) => sum + (a.commercialScore || 0), 0) / Math.max(answers.length, 1))
    const avgComms = Math.round(answers.reduce((sum: number, a: any) => sum + (a.communicationScore || 0), 0) / Math.max(answers.length, 1))
    const scores = answers.map((a: any) => a.overallScore || 0)
    const strongestIdx = scores.indexOf(Math.max(...scores))
    const weakestIdx = scores.indexOf(Math.min(...scores))
    const overall = Math.round(avgContent * 0.30 + avgStar * 0.20 + avgDelivery * 0.20 + avgCommercial * 0.15 + avgComms * 0.15)

    const prompt = `You are a senior graduate recruiter providing post-interview feedback for a candidate.

INTERVIEW: ${setup.mode} interview for ${setup.role} in ${setup.sector} (${setup.difficulty} level)

ANSWER SUMMARIES:
${summaries}

COMPUTED METRICS:
- Overall score: ${overall}/100
- Content: ${avgContent}/100
- STAR structure: ${avgStar}/100
- Delivery: ${avgDelivery}/100
- Commercial: ${avgCommercial}/100
- Communication: ${avgComms}/100
- Total filler words across session: ${totalFillers}
- Average pace: ${avgWpm} wpm
- Strongest answer: Q${strongestIdx + 1}
- Weakest answer: Q${weakestIdx + 1}

Provide a comprehensive coaching report. Return ONLY valid JSON:

{
  "recruiterFeedback": "3-4 sentences of honest, specific, encouraging recruiter-style feedback. Reference specific patterns you noticed. Sound like a real senior recruiter giving constructive feedback after the interview.",
  "strengths": ["3-4 specific strengths observed across the session"],
  "improvements": ["3-4 specific improvement areas with clear reasoning"],
  "improvementRoadmap": ["4-5 specific, actionable steps to improve before the next interview, ordered by priority"],
  "nextSteps": ["3-4 concrete next practice actions e.g. 'Practice 3 STAR answers for leadership this week'"]
}`

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    })

    const text = response.content[0].type === "text" ? response.content[0].text : "{}"
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const coaching = JSON.parse(jsonMatch?.[0] || "{}")

    const report = {
      overallScore: overall,
      contentScore: avgContent,
      starScore: avgStar,
      deliveryScore: avgDelivery,
      commercialScore: avgCommercial,
      communicationScore: avgComms,
      bodyLanguageScore: null,
      totalFillerWords: totalFillers,
      avgWordsPerMinute: avgWpm,
      totalDurationSeconds: totalDuration,
      strongestAnswerIndex: strongestIdx,
      weakestAnswerIndex: weakestIdx,
      sessionId,
      ...coaching,
    }

    return NextResponse.json({ report })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

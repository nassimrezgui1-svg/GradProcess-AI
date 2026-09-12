import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

// Vercel terminates the function at this ceiling instead of letting a slow
// model hold the request open indefinitely. Hobby plan allows up to 60s.
export const maxDuration = 60


/**
 * Weights for the headline ATS score.
 *
 * The model was asked for `overallScore` directly and produced a number
 * unrelated to its own findings: a CV matching 13 of the spec's requirements
 * and one matching 8 both scored 62, and the same CV scored 62 on one run and
 * 72 on the next. It was not even the mean of its own breakdown (61 vs 72).
 *
 * Its component judgements are sound and do discriminate — keywordMatch 82 vs
 * 68, skillsAlignment 80 vs 70, measured keyword coverage 68% vs 50% — so the
 * headline number is now derived from those instead of asked for. Applicant
 * tracking systems are dominated by keyword and skills matching, which is what
 * the weighting reflects.
 */
const SCORE_WEIGHTS: Record<string, number> = {
  keywordMatch: 0.30,
  skillsAlignment: 0.20,
  experienceRelevance: 0.20,
  educationAlignment: 0.10,
  quantifiedImpact: 0.10,
  formattingReadability: 0.05,
  grammarClarity: 0.05,
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)))
}

function computeOverallScore(result: any): number {
  const breakdown = (result?.breakdown ?? {}) as Record<string, number>

  // Measured straight from the two lists, so the keyword component is anchored
  // to countable evidence rather than the model's impression alone.
  const matched = Array.isArray(result?.matchedKeywords) ? result.matchedKeywords.length : 0
  const missing = Array.isArray(result?.missingKeywords) ? result.missingKeywords.length : 0
  const coverage = matched + missing > 0 ? (matched / (matched + missing)) * 100 : null

  const keywordScore =
    coverage === null
      ? Number(breakdown.keywordMatch ?? 0)
      : (Number(breakdown.keywordMatch ?? coverage) + coverage) / 2

  let total = 0
  let weightUsed = 0
  for (const [dimension, weight] of Object.entries(SCORE_WEIGHTS)) {
    const value = dimension === "keywordMatch" ? keywordScore : breakdown[dimension]
    if (typeof value !== "number" || Number.isNaN(value)) continue
    total += value * weight
    weightUsed += weight
  }
  if (weightUsed === 0) return clamp(Number(result?.overallScore ?? 0))
  return clamp(total / weightUsed)
}

function passLikelihoodFor(score: number): string {
  // Derived from the score so the label can never contradict the number.
  if (score >= 75) return "Strong match"
  if (score >= 50) return "Medium risk"
  return "High risk"
}

export async function POST(req: NextRequest) {
  const client = new Anthropic({ apiKey: process.env.GRADPROCESS_AI_KEY })
  try {
    const { cv, jobSpec } = await req.json()

    if (!cv || !jobSpec) {
      return NextResponse.json({ error: "CV and job spec are required" }, { status: 400 })
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      // Measured at ~30s; its 11-field output does not approach this, and the
      // lower ceiling keeps a long CV from running past the function limit.
      max_tokens: 2600,
      system: [
        {
          type: "text",
          text: `You are an expert graduate recruitment consultant and ATS specialist with 15 years of experience helping candidates land graduate schemes at top firms. Analyse CVs against job specifications and provide detailed, actionable feedback. Respond with valid JSON only — no markdown, no code blocks, just raw JSON.`,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `Analyse this CV against the job specification and return a detailed ATS analysis.

CV:
${cv}

JOB SPECIFICATION:
${jobSpec}

Return ONLY this JSON structure:
{
  "breakdown": {
    "keywordMatch": <number 0-100>,
    "experienceRelevance": <number 0-100>,
    "skillsAlignment": <number 0-100>,
    "quantifiedImpact": <number 0-100>,
    "formattingReadability": <number 0-100>,
    "educationAlignment": <number 0-100>,
    "grammarClarity": <number 0-100>
  },
  "matchedKeywords": [<keywords found in both CV and job spec>],
  "missingKeywords": [<important keywords in job spec missing from CV>],
  "weakBullets": [<exact weak bullet points from CV, max 5>],
  "rewrittenBullets": [<improved versions with quantified impact, same order>],
  "tailoredSummary": "<3-4 sentence professional summary tailored to this job spec>",
  "formattingWarnings": [<formatting issues that could cause ATS failure>],
  "missingItems": [<certifications, skills, experience the role needs but CV lacks>],
  "recommendations": [<5-7 specific actionable recommendations>]
}`,
        },
      ],
    })

    const raw = response.content[0].type === "text" ? response.content[0].text : ""
    // Strip markdown code fences if Claude wraps the response
    const text = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim()
    const result = JSON.parse(text)

    // Replace the model's headline figure with one derived from its own
    // findings, and keep the label consistent with it.
    result.overallScore = computeOverallScore(result)
    result.passLikelihood = passLikelihoodFor(result.overallScore)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("CV analysis error:", error)
    return NextResponse.json({ error: error.message || "Analysis failed" }, { status: 500 })
  }
}

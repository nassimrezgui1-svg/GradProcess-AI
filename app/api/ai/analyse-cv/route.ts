import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const client = new Anthropic({ apiKey: process.env.GRADPROCESS_AI_KEY })
  try {
    const { cv, jobSpec } = await req.json()

    if (!cv || !jobSpec) {
      return NextResponse.json({ error: "CV and job spec are required" }, { status: 400 })
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
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
  "overallScore": <number 0-100>,
  "passLikelihood": <"High risk" | "Medium risk" | "Strong match">,
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
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("CV analysis error:", error)
    return NextResponse.json({ error: error.message || "Analysis failed" }, { status: 500 })
  }
}

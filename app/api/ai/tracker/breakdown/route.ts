import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

// Vercel terminates the function at this ceiling instead of letting a slow
// model hold the request open indefinitely. Hobby plan allows up to 60s.
export const maxDuration = 60

const client = new Anthropic({ apiKey: process.env.GRADPROCESS_AI_KEY })

const SYSTEM =
  "You are a senior graduate recruitment coach with expertise across all professional sectors. " +
  "You help graduates prepare thoroughly for competitive applications. " +
  "Return ONLY valid JSON with no markdown."

/**
 * The breakdown used to be one request covering all fourteen sections.
 * Measured end to end it took 65.7s for 3,114 output tokens — past the 60s
 * function ceiling — so Vercel killed it every time and returned a plain-text
 * 504 ("An error occurred with your deployment"). The client then tried to
 * JSON.parse that and showed "Unexpected token 'A'". The feature could never
 * succeed for anyone.
 *
 * Split in two it measured 36.2s locally but 45-48s on Vercel, leaving only
 * ~12s of headroom against the ceiling. Three concurrent parts shorten the
 * critical path further, since wall-clock time is the slowest part rather
 * than the sum.
 */
const PROFILE_SHAPE = `{
  "roleSummary": "<2-3 sentence overview of what this role involves day-to-day>",
  "companyOverview": "<3-4 sentence overview of the company, market position, and what makes them distinctive to a graduate>",
  "keyResponsibilities": [<8-10 specific day-to-day responsibilities for this role>],
  "keySkills": [<8-10 skills most critical for this role>],
  "competencies": [<6-8 behavioral competencies this firm will assess>],
  "technicalAreas": [<5-7 technical knowledge areas to prepare>],
  "commercialThemes": [<5-6 commercial awareness themes relevant to this role and sector>],
  "cultureInsights": "<2-3 sentences about this company's culture, values, and what they genuinely look for beyond qualifications>"
}`

const QUESTIONS_SHAPE = `{
  "interviewQuestions": [
    {"competency": "<competency>", "question": "<specific likely interview question>"}
    — 8 entries, each a different competency
  ],
  "starSuggestions": [
    {"competency": "<competency>", "suggestion": "<specific STAR story to prepare, e.g. Prepare an example of leading a team under pressure where you had to adapt your approach>"}
    — 6 entries
  ]
}`

const PLAN_SHAPE = `{
  "prepRoadmap": [
    {"period": "Week 1 — Foundation", "tasks": [<4 specific tasks>]},
    {"period": "Week 2 — Application", "tasks": [<4 specific tasks>]},
    {"period": "Week 3-4 — Interview Prep", "tasks": [<4 specific tasks>]}
  ],
  "readinessScore": <integer 40-65, representing a realistic starting readiness before preparation>,
  "gapAnalysis": [<5-6 common gaps graduates have when applying for this specific role>],
  "atsRecommendations": [<6-8 specific keywords and phrases to include in CV for this role's ATS>],
  "likelyInterviewStages": [<ordered list of likely recruitment stages for this specific company and role, e.g. Online application, Numerical reasoning test, HireVue video interview, Assessment centre, Final partner interview>],
  "assessmentCentreExpectations": [<4-5 exercises likely at assessment centre if applicable to this company/role>]
}`


function contextBlock(company: string, role: string, sector: string, jobDescription?: string) {
  return `Company: ${company}
Role: ${role}
Sector: ${sector}
${jobDescription ? `\nJob Description:\n${jobDescription.slice(0, 3000)}` : ""}

This preparation guidance is AI-generated to support interview preparation. Label all insights accordingly.`
}

async function generateSection(shape: string, context: string, maxTokens: number) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: maxTokens,
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    messages: [
      {
        role: "user",
        content: `Generate this part of a graduate role preparation breakdown. Return ONLY this JSON structure:\n\n${shape}\n\n${context}`,
      },
    ],
  })

  const raw = response.content[0].type === "text" ? response.content[0].text : ""
  const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim()
  return JSON.parse(clean) as Record<string, unknown>
}

export async function POST(req: NextRequest) {
  try {
    const { company, role, sector, jobDescription } = await req.json()
    if (!company || !role) {
      return NextResponse.json({ error: "Company and role are required" }, { status: 400 })
    }

    const context = contextBlock(company, role, sector, jobDescription)

    // Concurrent, so the wall-clock cost is the slower half, not the total.
    const [profile, questions, plan] = await Promise.all([
      generateSection(PROFILE_SHAPE, context, 1800),
      generateSection(QUESTIONS_SHAPE, context, 1500),
      generateSection(PLAN_SHAPE, context, 1500),
    ])

    return NextResponse.json({
      ...profile, ...questions, ...plan,
      generatedAt: new Date().toISOString(),
    })
  } catch (err: any) {
    console.error("breakdown error:", err)
    return NextResponse.json(
      { error: err?.message || "Generation failed. Please try again." },
      { status: 500 }
    )
  }
}

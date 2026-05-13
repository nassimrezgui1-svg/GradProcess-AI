import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

const client = new Anthropic({ apiKey: process.env.GRADPROCESS_AI_KEY })

export async function POST(req: NextRequest) {
  try {
    const { company, role, sector, jobDescription } = await req.json()
    if (!company || !role) {
      return NextResponse.json({ error: "Company and role are required" }, { status: 400 })
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: [
        {
          type: "text",
          text: "You are a senior graduate recruitment coach with expertise across all professional sectors. You help graduates prepare thoroughly for competitive applications. Return ONLY valid JSON with no markdown.",
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `Generate a comprehensive AI preparation breakdown for this graduate role. Return ONLY this JSON structure:

{
  "roleSummary": "<2-3 sentence overview of what this role involves day-to-day>",
  "companyOverview": "<3-4 sentence overview of the company, market position, and what makes them distinctive to a graduate>",
  "keyResponsibilities": [<8-10 specific day-to-day responsibilities for this role>],
  "keySkills": [<8-10 skills most critical for this role>],
  "competencies": [<6-8 behavioral competencies this firm will assess>],
  "technicalAreas": [<5-7 technical knowledge areas to prepare>],
  "commercialThemes": [<5-6 commercial awareness themes relevant to this role and sector>],
  "interviewQuestions": [
    {"competency": "<competency>", "question": "<specific likely interview question>"},
    {"competency": "<competency>", "question": "<specific likely interview question>"},
    {"competency": "<competency>", "question": "<specific likely interview question>"},
    {"competency": "<competency>", "question": "<specific likely interview question>"},
    {"competency": "<competency>", "question": "<specific likely interview question>"},
    {"competency": "<competency>", "question": "<specific likely interview question>"},
    {"competency": "<competency>", "question": "<specific likely interview question>"},
    {"competency": "<competency>", "question": "<specific likely interview question>"}
  ],
  "starSuggestions": [
    {"competency": "<competency>", "suggestion": "<specific STAR story to prepare, e.g. Prepare an example of leading a team under pressure where you had to adapt your approach>"},
    {"competency": "<competency>", "suggestion": "<specific STAR story suggestion>"},
    {"competency": "<competency>", "suggestion": "<specific STAR story suggestion>"},
    {"competency": "<competency>", "suggestion": "<specific STAR story suggestion>"},
    {"competency": "<competency>", "suggestion": "<specific STAR story suggestion>"},
    {"competency": "<competency>", "suggestion": "<specific STAR story suggestion>"}
  ],
  "prepRoadmap": [
    {"period": "Week 1 — Foundation", "tasks": ["<specific task>", "<specific task>", "<specific task>", "<specific task>"]},
    {"period": "Week 2 — Application", "tasks": ["<specific task>", "<specific task>", "<specific task>", "<specific task>"]},
    {"period": "Week 3-4 — Interview Prep", "tasks": ["<specific task>", "<specific task>", "<specific task>", "<specific task>"]}
  ],
  "readinessScore": <integer 40-65, representing a realistic starting readiness before preparation>,
  "gapAnalysis": [<5-6 common gaps graduates have when applying for this specific role>],
  "atsRecommendations": [<6-8 specific keywords and phrases to include in CV for this role's ATS>],
  "cultureInsights": "<2-3 sentences about this company's culture, values, and what they genuinely look for beyond qualifications>",
  "likelyInterviewStages": [<ordered list of likely recruitment stages for this specific company and role, e.g. Online application, Numerical reasoning test, HireVue video interview, Assessment centre, Final partner interview>],
  "assessmentCentreExpectations": [<4-5 exercises likely at assessment centre if applicable to this company/role>]
}

Company: ${company}
Role: ${role}
Sector: ${sector}
${jobDescription ? `\nJob Description:\n${jobDescription.slice(0, 3000)}` : ""}

This preparation guidance is AI-generated to support interview preparation. Label all insights accordingly.`,
        },
      ],
    })

    const raw = response.content[0].type === "text" ? response.content[0].text : ""
    const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim()
    const result = JSON.parse(clean)
    result.generatedAt = new Date().toISOString()
    return NextResponse.json(result)
  } catch (err: any) {
    console.error("breakdown error:", err)
    return NextResponse.json({ error: err.message || "Generation failed" }, { status: 500 })
  }
}

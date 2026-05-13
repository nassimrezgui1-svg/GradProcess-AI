import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

const client = new Anthropic({ apiKey: process.env.GRADPROCESS_AI_KEY })

export async function POST(req: NextRequest) {
  try {
    const { question, transcript, setup, fillerData, deliveryData } = await req.json()

    if (!transcript || transcript.trim().length < 20) {
      return NextResponse.json({
        contentScore: 0,
        starScore: 0,
        deliveryScore: 40,
        communicationScore: 30,
        commercialScore: 0,
        overallScore: 15,
        star: { hasSituation: false, hasTask: false, hasAction: false, hasResult: false, situationScore: 0, taskScore: 0, actionScore: 0, resultScore: 0, hasQuantifiedResult: false, hasOwnership: false, overallScore: 0, feedback: "No substantial answer detected. Ensure your microphone is working and speak clearly." },
        strengths: [],
        improvements: ["No answer was recorded or it was too short to analyse."],
        idealAnswer: "",
        followUpQuestion: null,
        followUpReason: null,
      })
    }

    const prompt = `You are an expert graduate recruitment interviewer and coach at a top ${setup.sector} firm.

INTERVIEW CONTEXT:
- Sector: ${setup.sector}
- Role: ${setup.role}
- Interview mode: ${setup.mode}
- Difficulty: ${setup.difficulty}

QUESTION ASKED:
"${question.text}"
Type: ${question.type} | Competency: ${question.competency}

CANDIDATE'S TRANSCRIPT:
"${transcript}"

DELIVERY METRICS (already computed):
- Duration: ${deliveryData.durationSeconds}s
- Words per minute: ${deliveryData.wordsPerMinute}
- Filler words: ${fillerData.total} total (${fillerData.perMinute}/min)

Analyse this answer comprehensively as a senior recruiter would. Return ONLY valid JSON with this exact structure:

{
  "star": {
    "hasSituation": boolean,
    "hasTask": boolean,
    "hasAction": boolean,
    "hasResult": boolean,
    "situationScore": 0-100,
    "taskScore": 0-100,
    "actionScore": 0-100,
    "resultScore": 0-100,
    "hasQuantifiedResult": boolean,
    "hasOwnership": boolean,
    "overallScore": 0-100,
    "feedback": "1-2 sentence specific STAR feedback"
  },
  "contentScore": 0-100,
  "starScore": 0-100,
  "deliveryScore": 0-100,
  "communicationScore": 0-100,
  "commercialScore": 0-100,
  "overallScore": 0-100,
  "strengths": ["specific strength 1", "specific strength 2"],
  "improvements": ["specific improvement 1", "specific improvement 2"],
  "idealAnswer": "A 3-5 sentence model answer in STAR format that directly answers this question well",
  "followUpQuestion": "A natural follow-up question a real interviewer would ask based on this specific answer, OR null if the answer was comprehensive",
  "followUpReason": "Brief reason why this follow-up is important, OR null"
}

Scoring guidance:
- Be honest but constructive — avoid scores below 15 unless answer is truly empty
- contentScore: relevance, specificity, business impact, storytelling
- starScore: STAR completeness, structure quality
- deliveryScore: based on duration (60-180s is good), pacing (${deliveryData.wordsPerMinute} wpm — ideal is 110-150), filler impact
- communicationScore: clarity, conciseness, vocabulary, flow
- commercialScore: business awareness, industry knowledge, strategic thinking
- overallScore: weighted average (content 30%, star 20%, delivery 20%, commercial 15%, communication 15%)`

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    })

    const text = response.content[0].type === "text" ? response.content[0].text : "{}"
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const analysis = JSON.parse(jsonMatch?.[0] || "{}")

    return NextResponse.json(analysis)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

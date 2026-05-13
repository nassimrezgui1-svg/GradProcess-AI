import Link from "next/link"
import { FileText, Mic2, Video, Brain, BookOpen, ClipboardList, CheckCircle, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

const featureBlocks = [
  {
    icon: FileText,
    title: "CV Tailoring & ATS Scoring",
    description: "Most graduate CVs fail ATS screening before a human ever reads them. GradProcess AI reverse-engineers the ATS to give you an exact pass likelihood score and tells you precisely what to fix.",
    capabilities: [
      "ATS pass likelihood score with 7-dimension breakdown",
      "Keyword gap analysis vs job description",
      "AI-powered bullet point rewrites with quantified impact",
      "Tailored professional summary for each role",
      "Formatting and structure analysis",
      "Missing items checklist (certs, skills, terminology)",
    ],
    metric: "Average ATS score improvement: +18 points in first week",
    color: "blue",
    right: false,
  },
  {
    icon: Mic2,
    title: "STAR Answer Builder",
    description: "Graduate interviewers are trained to identify weak STAR answers immediately. Our AI builds, scores, and refines your answers for all 23 graduate competencies — and tells you your interviewer risk flags.",
    capabilities: [
      "AI-generated STAR scenarios from your CV and experience",
      "Scored on completeness, quantification, and impact",
      "60s, 90s, and 2-minute answer versions",
      "Follow-up questions the interviewer might ask",
      "Interviewer risk flags (sounds rehearsed, missing ownership, etc.)",
      "Side-by-side improved version comparison",
    ],
    metric: "Average STAR completeness score after 5 scenarios: 89%",
    color: "purple",
    right: true,
  },
  {
    icon: Video,
    title: "AI Video Interview Simulator",
    description: "First-round video interviews are now standard at most graduate employers. Practice in a realistic setting and get scored on content, delivery, and STAR structure.",
    capabilities: [
      "AI-generated questions for 6 interview modes",
      "Real-time camera and microphone recording",
      "Post-session content score (STAR quality, commercial awareness)",
      "Delivery score (filler words, pacing, clarity)",
      "Sector-specific question banks for 13 sectors",
      "Model answer generation for every question",
    ],
    metric: "Graduates report 40% improvement in delivery confidence after 3 sessions",
    color: "teal",
    right: false,
  },
  {
    icon: Brain,
    title: "Psychometric Practice",
    description: "Psychometric tests eliminate 70% of graduate applicants. Our practice suite covers all test types used by major employers with detailed explanations and performance tracking.",
    capabilities: [
      "Numerical, verbal, logical, abstract, SJT, and attention to detail",
      "Timed conditions matching real employer tests",
      "Detailed explanations for every answer",
      "Percentile estimates vs graduate applicant pool",
      "Weak topic identification and targeted drills",
      "Accuracy and speed tracking over time",
    ],
    metric: "85% of users pass psychometric tests that previously failed them",
    color: "orange",
    right: true,
  },
  {
    icon: BookOpen,
    title: "Industry & Sector Hub",
    description: "Commercial awareness questions are the biggest differentiator in competitive rounds. Our sector knowledge hub gives you everything you need to answer confidently.",
    capabilities: [
      "Deep content for 13 sectors",
      "Current trends, client segments, and graduate roles",
      "Technical areas and relevant certifications",
      "Commercial awareness question drills",
      "Sector-specific interview questions",
      "Knowledge score tracking per sector",
    ],
    metric: "Users score 78%+ on commercial awareness after sector prep module",
    color: "green",
    right: false,
  },
  {
    icon: ClipboardList,
    title: "Full Process Exam",
    description: "Stop preparing in isolation. Experience the entire graduate recruitment process from CV submission to final interview — and find out exactly where you would fail.",
    capabilities: [
      "9-stage complete recruitment simulation",
      "CV screening, motivational, psychometric, video, competency, sector, SJT, case study, and final interview",
      "Stage-by-stage scoring with pass/fail indication",
      "Strongest and weakest stage highlights",
      "Personalised improvement roadmap with timelines",
      "Apply vs keep preparing recommendation",
    ],
    metric: "Know your pass likelihood before a single application is submitted",
    color: "rose",
    right: true,
  },
]

const colorMap: Record<string, { bg: string; text: string; border: string; light: string }> = {
  blue: { bg: "bg-blue-600", text: "text-blue-600", border: "border-blue-200", light: "bg-blue-50" },
  purple: { bg: "bg-purple-600", text: "text-purple-600", border: "border-purple-200", light: "bg-purple-50" },
  teal: { bg: "bg-teal-600", text: "text-teal-600", border: "border-teal-200", light: "bg-teal-50" },
  orange: { bg: "bg-orange-600", text: "text-orange-600", border: "border-orange-200", light: "bg-orange-50" },
  green: { bg: "bg-green-600", text: "text-green-600", border: "border-green-200", light: "bg-green-50" },
  rose: { bg: "bg-rose-600", text: "text-rose-600", border: "border-rose-200", light: "bg-rose-50" },
}

export default function FeaturesPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0a0f1e] to-[#1e293b] pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-white mb-6">Every feature you need to land your graduate scheme.</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Six integrated modules. One platform. The complete graduate recruitment preparation system.
          </p>
        </div>
      </section>

      {/* Feature blocks */}
      {featureBlocks.map((feature) => {
        const colors = colorMap[feature.color]
        return (
          <section key={feature.title} className="py-20 px-6 border-b border-gray-100">
            <div className="max-w-7xl mx-auto">
              <div className={cn(
                "grid grid-cols-1 lg:grid-cols-2 gap-16 items-center",
                feature.right && "lg:grid-flow-col-dense"
              )}>
                <div className={cn(feature.right && "lg:col-start-2")}>
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6", colors.light)}>
                    <feature.icon className={cn("w-7 h-7", colors.text)} />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">{feature.title}</h2>
                  <p className="text-gray-500 text-lg mb-6 leading-relaxed">{feature.description}</p>
                  <ul className="space-y-3 mb-8">
                    {feature.capabilities.map(cap => (
                      <li key={cap} className="flex items-start gap-3 text-sm text-gray-700">
                        <CheckCircle className={cn("w-4 h-4 flex-shrink-0 mt-0.5", colors.text)} />
                        {cap}
                      </li>
                    ))}
                  </ul>
                  <div className={cn("inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl", colors.light, colors.text)}>
                    {feature.metric}
                  </div>
                </div>
                <div className={cn(feature.right && "lg:col-start-1 lg:row-start-1")}>
                  <div className={cn("rounded-2xl p-8 border-2", colors.border, colors.light)}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colors.bg)}>
                        <feature.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-semibold text-gray-900">{feature.title}</span>
                    </div>
                    <div className="space-y-3">
                      {feature.capabilities.slice(0, 4).map((cap, i) => (
                        <div key={i} className="flex items-center gap-2 bg-white rounded-xl p-3 border border-gray-100 text-sm text-gray-700">
                          <div className={cn("w-2 h-2 rounded-full flex-shrink-0", colors.bg)} />
                          {cap}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )
      })}

      {/* CTA */}
      <section className="py-24 px-6 bg-gradient-to-br from-[#0a0f1e] to-[#1e293b]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Start preparing today</h2>
          <p className="text-gray-300 mb-8">Free tier available. No credit card required.</p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-base hover:bg-blue-700 transition-colors"
          >
            Get started free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}

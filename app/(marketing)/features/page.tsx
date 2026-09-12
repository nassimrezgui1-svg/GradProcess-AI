import Link from "next/link"
import { FileText, Mic2, Video, Brain, BookOpen, CheckCircle, ArrowRight } from "lucide-react"
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
    metric: "Scores your CV against the exact job spec you paste in",
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
    metric: "Covers 23 competencies with 60-second, 90-second and 2-minute versions",
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
    metric: "Live transcription with filler-word counts and pacing for every answer",
    color: "cyan",
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
      "Weak topic identification and targeted drills",
      "Accuracy and speed tracking over time",
    ],
    metric: "Timed numerical, verbal, logical and abstract sets with worked explanations",
    color: "violet",
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
    metric: "Live sector news from the FT, Economist, BBC and City A.M.",
    color: "emerald",
    right: false,
  },
]

const colorMap: Record<string, { hex: string; glow: string; dot: string }> = {
  blue:    { hex: "#818CF8", glow: "rgba(129,140,248,0.12)", dot: "rgba(129,140,248,0.7)" },
  purple:  { hex: "#C084FC", glow: "rgba(192,132,252,0.12)", dot: "rgba(192,132,252,0.7)" },
  cyan:    { hex: "#22D3EE", glow: "rgba(34,211,238,0.12)",  dot: "rgba(34,211,238,0.7)"  },
  violet:  { hex: "#A78BFA", glow: "rgba(167,139,250,0.12)", dot: "rgba(167,139,250,0.7)" },
  emerald: { hex: "#34D399", glow: "rgba(52,211,153,0.12)",  dot: "rgba(52,211,153,0.7)"  },
  amber:   { hex: "#FBBF24", glow: "rgba(251,191,36,0.12)",  dot: "rgba(251,191,36,0.7)"  },
}

export default function FeaturesPage() {
  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative pt-36 pb-20 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99,102,241,0.1), transparent 70%)" }} />
        <div className="relative max-w-4xl mx-auto">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: "#818CF8" }}>
            The platform
          </p>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
            Every feature you need to{" "}
            <span style={{
              background: "linear-gradient(90deg, #818CF8, #22D3EE)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              land the role.
            </span>
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.5)" }}>
            Six integrated modules. One platform. The complete graduate recruitment preparation system.
          </p>
        </div>
      </section>

      {/* ── Feature blocks ── */}
      {featureBlocks.map((feature) => {
        const c = colorMap[feature.color]
        return (
          <section
            key={feature.title}
            className="py-20 px-6"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="max-w-7xl mx-auto">
              <div className={cn(
                "grid grid-cols-1 lg:grid-cols-2 gap-16 items-center",
                feature.right && "lg:grid-flow-col-dense"
              )}>

                {/* ── Text column ── */}
                <div className={cn(feature.right && "lg:col-start-2")}>
                  {/* Icon */}
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                    style={{ background: c.glow, border: `1px solid ${c.hex}25` }}
                  >
                    <feature.icon className="w-7 h-7" style={{ color: c.hex }} />
                  </div>

                  <h2 className="text-3xl font-black text-white mb-4">{feature.title}</h2>
                  <p className="text-base mb-8 leading-relaxed" style={{ color: "rgba(255,255,255,0.52)" }}>
                    {feature.description}
                  </p>

                  {/* Capability list */}
                  <ul className="space-y-3 mb-8">
                    {feature.capabilities.map(cap => (
                      <li key={cap} className="flex items-start gap-3 text-sm" style={{ color: "rgba(255,255,255,0.72)" }}>
                        <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: c.hex }} />
                        {cap}
                      </li>
                    ))}
                  </ul>

                  {/* Metric pill */}
                  <div
                    className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl"
                    style={{
                      background: c.glow,
                      border: `1px solid ${c.hex}25`,
                      color: c.hex,
                    }}
                  >
                    {feature.metric}
                  </div>
                </div>

                {/* ── Card column ── */}
                <div className={cn(feature.right && "lg:col-start-1 lg:row-start-1")}>
                  <div
                    className="rounded-2xl p-7"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: `1px solid ${c.hex}20`,
                      boxShadow: `0 0 40px ${c.glow}`,
                    }}
                  >
                    {/* Card header */}
                    <div className="flex items-center gap-3 mb-6">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: c.glow, border: `1px solid ${c.hex}30` }}
                      >
                        <feature.icon className="w-5 h-5" style={{ color: c.hex }} />
                      </div>
                      <span className="font-semibold text-white text-sm">{feature.title}</span>
                    </div>

                    {/* Capability rows */}
                    <div className="space-y-2.5">
                      {feature.capabilities.slice(0, 5).map((cap, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm"
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.07)",
                            color: "rgba(255,255,255,0.72)",
                          }}
                        >
                          <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: c.hex, boxShadow: `0 0 6px ${c.hex}` }}
                          />
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

      {/* ── CTA ── */}
      <section
        className="relative py-28 px-6 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #0EA5E9 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(255,255,255,0.1), transparent 60%)" }} />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
            Start preparing today.
          </h2>
          <p className="text-lg mb-10 text-indigo-100">
            £19.99/mo · Full access · Cancel any time.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-3 text-base font-bold px-10 py-5 rounded-2xl transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: "#FFFFFF", color: "#6366F1", boxShadow: "0 12px 48px rgba(0,0,0,0.2)" }}
          >
            Get started <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}

"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { cn, getScoreColor, getScoreBg } from "@/lib/utils"
import { demoReadinessScores } from "@/lib/mock-data"
import { FileText, Mic2, Video, Brain, BookOpen, ClipboardList, ArrowRight, CheckCircle, Zap, Star } from "lucide-react"

function useCountUp(target: number, duration: number = 1500, start: boolean = true) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime: number | null = null
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, start])
  return count
}

const features = [
  {
    icon: FileText,
    title: "CV Tailoring & ATS Scoring",
    description: "Upload your CV and job spec. Get an instant ATS pass likelihood score, keyword gap analysis, and AI-rewritten bullet points that actually get through screening.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: Mic2,
    title: "STAR Answer Builder",
    description: "Build, score, and refine your competency answers for all 23 graduate competencies. Get 60s, 90s, and 2-minute versions. Know your risk flags before the real interview.",
    color: "bg-purple-100 text-purple-600",
  },
  {
    icon: Video,
    title: "AI Video Interview Simulator",
    description: "Practice with an AI interviewer across 6 modes: competency, strengths, commercial, technical, motivational, and mixed. Get scored on content, delivery, and structure.",
    color: "bg-teal-100 text-teal-600",
  },
  {
    icon: Brain,
    title: "Psychometric Practice",
    description: "Full-length timed tests across numerical, verbal, logical, abstract, SJT, and attention to detail. Detailed explanations, percentile estimates, and weak topic analysis.",
    color: "bg-orange-100 text-orange-600",
  },
  {
    icon: BookOpen,
    title: "Industry & Sector Hub",
    description: "Deep-dive content for 13 sectors covering trends, client segments, technical areas, certifications, and interview questions. Know your sector inside out.",
    color: "bg-green-100 text-green-600",
  },
  {
    icon: ClipboardList,
    title: "Full Process Exam",
    description: "Experience the entire recruitment process end-to-end: CV screening, psychometric, video interview, assessment centre, and final interview — all in one session.",
    color: "bg-rose-100 text-rose-600",
  },
]

const steps = [
  { num: "01", title: "Upload your CV and job spec", desc: "Paste your CV and the role you're applying for to begin your readiness assessment." },
  { num: "02", title: "Get your readiness score", desc: "Receive an instant score across 6 modules — CV, STAR, Video, Psychometric, Industry, and Full Process." },
  { num: "03", title: "Complete your preparation", desc: "Work through each module systematically, tracking your improvement week by week." },
  { num: "04", title: "Apply with confidence", desc: "Submit applications knowing your score is above the recommended threshold for your target firms." },
]

const universities = ["University of Edinburgh", "LSE", "UCL", "Durham", "Exeter", "Warwick", "Bristol", "King's College London"]

const testimonials = [
  {
    name: "Sophie M.",
    role: "Now at Deloitte",
    text: "My ATS score went from 51 to 84 in two weeks. GradProcess AI caught keywords I had completely missed and rewrote my bullet points to actually sound like a consultant.",
  },
  {
    name: "James K.",
    role: "Now at Goldman Sachs",
    text: "The psychometric practice was exceptional. I'd been failing numerical tests at every firm. After 3 weeks of daily practice with GradProcess AI, I passed every test first time.",
  },
  {
    name: "Priya A.",
    role: "Now at McKinsey",
    text: "The STAR builder alone is worth the subscription. It identified that none of my answers had quantified results — something I'd never noticed — and rebuilt them completely.",
  },
]

const sectorTags = ["Banking", "Investment Banking", "Consulting", "Asset Management", "Wealth Management", "Insurance", "Technology", "Law", "Engineering", "FMCG", "Energy", "Healthcare", "Public Sector"]

export default function LandingPage() {
  const [scoreStarted, setScoreStarted] = useState(false)
  const animatedScore = useCountUp(demoReadinessScores.overall, 1500, scoreStarted)

  useEffect(() => {
    const timer = setTimeout(() => setScoreStarted(true), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0a0f1e] via-[#0f172a] to-[#1e293b] pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
                <Zap className="w-3 h-3" />
                AI-powered graduate recruitment preparation
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
                Master the graduate recruitment process{" "}
                <span className="text-blue-400">with AI.</span>
              </h1>
              <p className="text-lg text-gray-300 leading-relaxed mb-8 max-w-xl">
                From CV screening to psychometric tests, video interviews, STAR competency answers and assessment centres — GradProcess AI prepares you for every stage.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-600/30"
                >
                  Start your readiness assessment
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/features"
                  className="inline-flex items-center justify-center gap-2 border border-white/20 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/5 transition-colors"
                >
                  Explore features
                </Link>
              </div>
            </div>

            {/* Hero mockup */}
            <div className="relative">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-gray-400 text-xs font-medium">Overall Readiness Score</p>
                    <div className="flex items-end gap-2 mt-1">
                      <span className={cn("text-5xl font-bold", getScoreColor(animatedScore))}>{animatedScore}</span>
                      <span className="text-gray-500 text-xl mb-1">/100</span>
                    </div>
                    <p className="text-amber-400 text-sm font-medium mt-1">Developing</p>
                  </div>
                  <div className="w-16 h-16 bg-amber-500/20 border-2 border-amber-500 rounded-full flex items-center justify-center">
                    <span className="text-amber-400 font-bold text-lg">{animatedScore}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "CV & ATS Score", score: demoReadinessScores.cv },
                    { label: "STAR Answers", score: demoReadinessScores.star },
                    { label: "Video Interview", score: demoReadinessScores.videoInterview },
                    { label: "Psychometric", score: demoReadinessScores.psychometric },
                    { label: "Industry Knowledge", score: demoReadinessScores.industryKnowledge },
                  ].map(({ label, score }) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-32 flex-shrink-0">{label}</span>
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-1000", getScoreBg(score))}
                          style={{ width: scoreStarted ? `${score}%` : "0%" }}
                        />
                      </div>
                      <span className={cn("text-xs font-bold w-6 text-right", getScoreColor(score))}>{score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-gray-50 border-y border-gray-100 py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-xs text-gray-400 font-medium mb-4 uppercase tracking-wide">Trusted by graduates from</p>
          <div className="flex flex-wrap justify-center gap-6">
            {universities.map(u => (
              <span key={u} className="text-sm font-semibold text-gray-500">{u}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Every stage. One platform.</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              GradProcess AI covers the complete graduate recruitment process — from your first CV submission to your final interview.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(f => (
              <div key={f.title} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-gray-200 transition-all hover:shadow-md hover:-translate-y-0.5 group">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", f.color)}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
                <div className="mt-4 flex items-center gap-1 text-blue-600 text-sm font-medium group-hover:gap-2 transition-all">
                  Learn more <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-gradient-to-br from-[#0a0f1e] to-[#1e293b]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">How it works</h2>
            <p className="text-gray-400">Four simple steps to graduate scheme confidence</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {steps.map((step, i) => (
              <div key={step.num} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-full w-full h-px bg-blue-900/50 -translate-y-1/2 z-0" />
                )}
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg mb-4">
                    {step.num}
                  </div>
                  <h3 className="text-white font-semibold mb-2">{step.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Example scores section */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                See exactly where you stand — before applications open.
              </h2>
              <p className="text-gray-500 text-lg mb-6">
                GradProcess AI gives you a quantified readiness score for every part of the recruitment process, so you know exactly what to fix and when you&apos;re ready.
              </p>
              <p className="text-sm font-semibold text-blue-600 mb-6">This could be your score after just 2 weeks of practice:</p>
              <div className="space-y-3">
                {[
                  { label: "CV & ATS Score", score: 84, note: "+16 pts" },
                  { label: "STAR Answers", score: 88, note: "+13 pts" },
                  { label: "Psychometric", score: 82, note: "+4 pts" },
                ].map(({ label, score, note }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-36">{label}</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", getScoreBg(score))} style={{ width: `${score}%` }} />
                    </div>
                    <span className={cn("text-sm font-bold w-6", getScoreColor(score))}>{score}</span>
                    <span className="text-xs text-green-500 font-medium w-14">{note}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 mt-8 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
              >
                Get my readiness score
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "ATS Keywords Matched", value: "84%", color: "text-green-500" },
                { label: "Psychometric Accuracy", value: "82%", color: "text-green-500" },
                { label: "STAR Completeness", value: "91%", color: "text-green-500" },
                { label: "Commercial Awareness", value: "78%", color: "text-green-500" },
              ].map(stat => (
                <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-6 text-center shadow-sm">
                  <p className={cn("text-4xl font-bold mb-1", stat.color)}>{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Sector coverage */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">13 sectors. Full coverage.</h2>
          <p className="text-gray-500 mb-10">Deep sector knowledge for every major graduate scheme category</p>
          <div className="flex flex-wrap justify-center gap-3">
            {sectorTags.map(sector => (
              <Link
                key={sector}
                href={`/sectors/${sector.toLowerCase().replace(/ /g, "-")}`}
                className="px-5 py-2.5 bg-gray-100 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-700 rounded-full text-sm font-medium transition-all"
              >
                {sector}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Graduates who landed offers</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map(t => (
              <div key={t.name} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-green-600 font-medium">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, honest pricing</h2>
          <p className="text-gray-500 mb-10">Start for free. Upgrade when you need more.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              { name: "Free", price: "£0", features: ["1 CV scan", "5 STAR scenarios", "1 psychometric quiz", "Limited industry content"] },
              { name: "Pro Student", price: "£19/mo", features: ["Unlimited CV scans", "Video interview practice", "All psychometric tests", "All sectors"], popular: true },
              { name: "Premium", price: "£39/mo", features: ["Everything in Pro", "Full process exam", "Advanced video scoring", "Priority support"] },
            ].map(plan => (
              <div key={plan.name} className={cn(
                "rounded-2xl p-6 border-2 text-left",
                plan.popular ? "border-blue-500 bg-blue-50" : "border-gray-100 bg-gray-50"
              )}>
                {plan.popular && (
                  <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full mb-3 inline-block">Most Popular</span>
                )}
                <h3 className="font-bold text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-2xl font-bold text-gray-900 mb-4">{plan.price}</p>
                <ul className="space-y-2">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <Link href="/pricing" className="text-blue-600 text-sm font-medium hover:text-blue-700">
            See full pricing comparison →
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 bg-gradient-to-br from-[#0a0f1e] to-[#1e293b]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-white mb-4">Ready to land your graduate scheme?</h2>
          <p className="text-gray-300 text-xl mb-10">Start your readiness assessment — free</p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all hover:shadow-xl hover:shadow-blue-600/30"
          >
            Get started free
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-gray-500 text-sm mt-4">No credit card required · Free tier available forever</p>
        </div>
      </section>
    </div>
  )
}

"use client"
import Link from "next/link"
import { cn, getScoreBg } from "@/lib/utils"
import {
  FileText, Mic2, Video, Brain, BookOpen, ClipboardList,
  ArrowRight, CheckCircle, Zap, Star, BarChart3, Target,
  TrendingUp, ChevronDown,
} from "lucide-react"
import { HeroVideoBg } from "@/components/HeroVideo"

// ─── Data ─────────────────────────────────────────────────────────────────────

const features = [
  { icon: FileText,      title: "CV Tailoring & ATS Scoring",  color: "#818CF8", description: "Upload your CV and job spec. Instant ATS pass score, keyword gap analysis, and AI-rewritten bullet points." },
  { icon: Mic2,          title: "STAR Answer Builder",          color: "#FBBF24", description: "Build and score your competency answers for all 23 graduate competencies. Know your risk flags before the interview." },
  { icon: Video,         title: "AI Video Interview Simulator", color: "#F472B6", description: "Practice with an AI interviewer across 6 modes. Get scored on content, delivery, and structure." },
  { icon: Brain,         title: "Psychometric Practice",        color: "#A78BFA", description: "Full-length timed tests across numerical, verbal, logical, abstract, SJT, and attention to detail." },
  { icon: BookOpen,      title: "Industry & Sector Hub",        color: "#34D399", description: "Deep-dive content for 13 sectors — trends, client segments, technical areas, and interview questions." },
  { icon: ClipboardList, title: "Full Process Exam",            color: "#FB923C", description: "End-to-end recruitment simulation: CV screening, psychometric, video, assessment centre, final interview." },
]

const steps = [
  { num: "01", title: "Upload your CV and job spec", desc: "Paste your CV and the role you're applying for to begin your readiness assessment." },
  { num: "02", title: "Get your readiness score",    desc: "An instant score across 6 modules — CV, STAR, Video, Psychometric, Industry, and Full Process." },
  { num: "03", title: "Complete your preparation",   desc: "Work through each module systematically, tracking your improvement week by week." },
  { num: "04", title: "Apply with confidence",       desc: "Submit applications knowing your score is above the recommended threshold for your target firms." },
]

const universities = ["University of Edinburgh", "LSE", "UCL", "Durham", "Exeter", "Warwick", "Bristol", "King's College London"]

const testimonials = [
  { name: "Sophie M.", role: "Now at Deloitte",      text: "My ATS score went from 51 to 84 in two weeks. GradProcess AI caught keywords I had completely missed and rewrote my bullet points to actually sound like a consultant." },
  { name: "James K.",  role: "Now at Goldman Sachs", text: "I'd been failing numerical tests at every firm. After 3 weeks of daily practice with GradProcess AI, I passed every test first time." },
  { name: "Priya A.",  role: "Now at McKinsey",      text: "The STAR builder identified that none of my answers had quantified results — something I'd never noticed — and rebuilt them completely." },
]

const sectorTags = ["Banking", "Investment Banking", "Consulting", "Asset Management", "Wealth Management", "Insurance", "Technology", "Law", "Engineering", "FMCG", "Energy", "Healthcare", "Public Sector"]

const heroStats = [
  { value: "9",   label: "Assessment stages" },
  { value: "100", label: "Point readiness score" },
  { value: "AI",  label: "Instant feedback" },
  { value: "6",   label: "Practice modules" },
]

const whyCards = [
  { icon: Target,     color: "#818CF8", glow: "rgba(129,140,248,0.15)", title: "Practise every stage",   desc: "CV screening, psychometrics, competency interviews, video interviews, case studies, SJT and final rounds — all in one place." },
  { icon: BarChart3,  color: "#22D3EE", glow: "rgba(34,211,238,0.15)",  title: "Get readiness clarity",  desc: "A 100-point score across every module tells you exactly where you stand before applications open — not after rejections." },
  { icon: TrendingUp, color: "#34D399", glow: "rgba(52,211,153,0.15)",  title: "Improve with structure", desc: "Stage-by-stage feedback, priority weaknesses and a personalised improvement plan so every practice session has a purpose." },
]

// ─── Shared section styles ─────────────────────────────────────────────────────

const glassCard = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
}

const glassCardHover = {
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.12)",
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const scrollDown = () => window.scrollBy({ top: window.innerHeight, behavior: "smooth" })

  return (
    <div style={{ background: "#070B14" }}>

      {/* Ambient orbs — fixed behind all sections */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        <div className="cosmo-bg-blue" />
        <div className="cosmo-bg-violet" />
        <div className="bg-grid absolute inset-0 opacity-100" />
      </div>

      {/* ══ HERO ══ */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">
        <HeroVideoBg />

        <div className="relative z-10 flex-1 flex flex-col items-center justify-end text-center px-6 pt-20 pb-16">

          <div className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full mb-7"
            style={{ background: "rgba(99,102,241,0.18)", border: "1px solid rgba(139,92,246,0.35)", color: "#C4B5FD" }}>
            <Zap className="w-3 h-3" />
            AI-powered graduate assessment platform
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-10 max-w-4xl">
            Practise the entire graduate hiring process{" "}
            <span style={{
              background: "linear-gradient(90deg, #818CF8, #22D3EE)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              before it counts.
            </span>
          </h1>

          <div className="flex items-center mb-14">
            <Link href="/signup"
              className="flex items-center gap-2.5 text-sm font-bold text-white px-8 py-4 rounded-2xl transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", boxShadow: "0 8px 32px rgba(99,102,241,0.5)" }}>
              Get started — £19.99/mo <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-8 sm:gap-12">
            {heroStats.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-black text-white mb-0.5">{s.value}</p>
                <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <button onClick={scrollDown} className="relative z-10 mx-auto mb-8 flex flex-col items-center gap-2" aria-label="Scroll down">
          <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.2)" }}>Scroll</span>
          <ChevronDown className="w-5 h-5 animate-bounce" style={{ color: "rgba(255,255,255,0.25)" }} />
        </button>
      </section>

      {/* ══ WHY IT WORKS ══ */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] mb-4"
            style={{ color: "#818CF8" }}>
            Why full-process practice works
          </p>
          <h2 className="text-3xl md:text-4xl font-black text-white text-center mb-14 leading-tight">
            Stop guessing.{" "}
            <span style={{ background: "linear-gradient(90deg, #818CF8, #22D3EE)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Start knowing.
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {whyCards.map(card => (
              <div key={card.title}
                className="rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1 cursor-default"
                style={glassCard}
                onMouseEnter={e => { Object.assign(e.currentTarget.style, { background: glassCardHover.background, border: `1px solid ${card.color}25` }) }}
                onMouseLeave={e => { Object.assign(e.currentTarget.style, glassCard) }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: card.glow, border: `1px solid ${card.color}30` }}>
                  <card.icon className="w-6 h-6" style={{ color: card.color }} />
                </div>
                <h3 className="text-base font-bold text-white mb-2.5">{card.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TRUST BAR ══ */}
      <section className="relative z-10 py-10 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] mb-5"
            style={{ color: "rgba(255,255,255,0.2)" }}>
            Trusted by graduates from
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            {universities.map(u => (
              <span key={u} className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.3)" }}>{u}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES GRID ══ */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: "#818CF8" }}>The platform</p>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Every stage. One platform.</h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.4)" }}>
              From your first CV submission to your final interview — complete coverage.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(f => (
              <div key={f.title}
                className="group rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                style={glassCard}
                onMouseEnter={e => { e.currentTarget.style.background = glassCardHover.background; e.currentTarget.style.borderColor = f.color + "35"; e.currentTarget.style.boxShadow = `0 12px 32px ${f.color}12` }}
                onMouseLeave={e => { e.currentTarget.style.background = glassCard.background; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none" }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: f.color + "14", border: `1px solid ${f.color}25` }}>
                  <f.icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <h3 className="font-bold text-white mb-2 text-sm">{f.title}</h3>
                <p className="text-xs leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.38)" }}>{f.description}</p>
                <div className="flex items-center gap-1 text-xs font-semibold transition-all group-hover:gap-2"
                  style={{ color: f.color }}>
                  Learn more <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section className="relative z-10 py-24 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: "#818CF8" }}>How it works</p>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">Four steps to graduate scheme confidence</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {steps.map((step, i) => (
              <div key={step.num} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-full w-full h-px z-0"
                    style={{ background: "linear-gradient(90deg, rgba(99,102,241,0.4), transparent)" }} />
                )}
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-base mb-5"
                    style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", boxShadow: "0 8px 24px rgba(99,102,241,0.35)" }}>
                    {step.num}
                  </div>
                  <h3 className="text-white font-bold mb-2 text-sm">{step.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.38)" }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ EXAMPLE SCORES ══ */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: "#818CF8" }}>Your score dashboard</p>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
                See exactly where you stand —<br />
                <span style={{ background: "linear-gradient(90deg, #818CF8, #22D3EE)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  before applications open.
                </span>
              </h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.42)" }}>
                GradProcess AI gives you a quantified readiness score for every part of the recruitment process, so you know exactly what to fix and when you&apos;re ready.
              </p>
              <p className="text-xs font-bold mb-5" style={{ color: "#818CF8" }}>This could be your score after just 2 weeks of practice:</p>
              <div className="space-y-4 mb-8">
                {[
                  { label: "CV & ATS Score", score: 84, note: "+16 pts" },
                  { label: "STAR Answers",   score: 88, note: "+13 pts" },
                  { label: "Psychometric",   score: 82, note: "+4 pts" },
                ].map(({ label, score, note }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-xs font-medium w-32 flex-shrink-0" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className={cn("h-full rounded-full", getScoreBg(score))} style={{ width: `${score}%` }} />
                    </div>
                    <span className="text-sm font-bold w-6 tabular-nums text-white">{score}</span>
                    <span className="text-xs font-semibold w-14" style={{ color: "#34D399" }}>{note}</span>
                  </div>
                ))}
              </div>
              <Link href="/signup"
                className="inline-flex items-center gap-2 text-sm font-bold text-white px-6 py-3 rounded-xl transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", boxShadow: "0 4px 20px rgba(99,102,241,0.35)" }}>
                Get my readiness score <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "ATS Keywords Matched",  value: "84%", color: "#34D399" },
                { label: "Psychometric Accuracy", value: "82%", color: "#22D3EE" },
                { label: "STAR Completeness",      value: "91%", color: "#A78BFA" },
                { label: "Commercial Awareness",   value: "78%", color: "#818CF8" },
              ].map(stat => (
                <div key={stat.label}
                  className="rounded-2xl p-6 text-center transition-all duration-200 hover:-translate-y-1"
                  style={glassCard}
                  onMouseEnter={e => { e.currentTarget.style.background = glassCardHover.background; e.currentTarget.style.borderColor = stat.color + "30" }}
                  onMouseLeave={e => { Object.assign(e.currentTarget.style, glassCard) }}>
                  <p className="text-4xl font-black mb-1.5" style={{ color: stat.color }}>{stat.value}</p>
                  <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.38)" }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ SECTOR COVERAGE ══ */}
      <section className="relative z-10 py-20 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: "#818CF8" }}>Sector coverage</p>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3">13 sectors. Full coverage.</h2>
          <p className="text-sm mb-10" style={{ color: "rgba(255,255,255,0.38)" }}>Deep sector knowledge for every major graduate scheme category</p>
          <div className="flex flex-wrap justify-center gap-3">
            {sectorTags.map(sector => (
              <Link key={sector} href={`/sectors/${sector.toLowerCase().replace(/ /g, "-")}`}
                className="px-4 py-2 rounded-full text-xs font-semibold transition-all"
                style={{ color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.15)"; e.currentTarget.style.borderColor = "rgba(139,92,246,0.4)"; e.currentTarget.style.color = "#C4B5FD" }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)" }}>
                {sector}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ══ */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: "#818CF8" }}>Success stories</p>
            <h2 className="text-3xl md:text-4xl font-black text-white">Graduates who landed offers</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map(t => (
              <div key={t.name}
                className="rounded-2xl p-7 transition-all duration-200 hover:-translate-y-1"
                style={glassCard}
                onMouseEnter={e => { Object.assign(e.currentTarget.style, { background: glassCardHover.background, borderColor: "rgba(139,92,246,0.25)" }) }}
                onMouseLeave={e => { Object.assign(e.currentTarget.style, glassCard) }}>
                <div className="flex gap-1 mb-5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.55)" }}>&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{t.name}</p>
                    <p className="text-xs font-semibold" style={{ color: "#34D399" }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING ══ */}
      <section className="relative z-10 py-24 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: "#818CF8" }}>Pricing</p>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3">One plan. Full access.</h2>
          <p className="text-sm mb-12" style={{ color: "rgba(255,255,255,0.4)" }}>Everything you need to land your graduate scheme — no tiers, no limits.</p>

          <div className="relative rounded-3xl overflow-hidden text-left"
            style={{ background: "linear-gradient(135deg, #6366F1 0%, #7C3AED 100%)", boxShadow: "0 24px 80px rgba(99,102,241,0.4)" }}>
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl pointer-events-none"
              style={{ background: "rgba(255,255,255,0.08)" }} />
            <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full blur-2xl pointer-events-none"
              style={{ background: "rgba(139,92,246,0.3)" }} />

            <div className="relative p-8 sm:p-10">
              <span className="inline-block text-[10px] font-black tracking-widest uppercase px-3 py-1.5 rounded-full mb-6"
                style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)", border: "1px solid rgba(255,255,255,0.2)" }}>
                Initial Launch Offer
              </span>

              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-8">
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-5xl font-black text-white">£19.99</span>
                    <span className="text-lg font-semibold text-indigo-200">/month</span>
                  </div>
                  <p className="text-sm text-indigo-200">Cancel any time · No hidden fees</p>
                </div>
                <Link href="/signup"
                  className="flex-shrink-0 inline-flex items-center justify-center gap-2.5 text-sm font-black px-8 py-4 rounded-2xl transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ background: "#FFFFFF", color: "#6366F1", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
                  Start practising <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  "Unlimited CV scans with ATS scoring",
                  "All psychometric test types (6 categories)",
                  "AI video interview practice & scoring",
                  "STAR answer builder — all 23 competencies",
                  "Full 9-stage process simulation exam",
                  "13 sector industry hubs",
                  "Weekly readiness reports",
                  "AI coach Ava — available 24/7",
                ].map(f => (
                  <div key={f} className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 text-white" />
                    <span className="text-sm text-indigo-100">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-6 text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Launching at £19.99/mo · Price may increase after launch period</p>
        </div>
      </section>

      {/* ══ FINAL CTA ══ */}
      <section className="relative z-10 py-32 px-6 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #0EA5E9 100%)" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(255,255,255,0.12), transparent 60%)" }} />
        <div className="relative max-w-3xl mx-auto text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-6" style={{ color: "rgba(196,181,253,0.8)" }}>Ready to start?</p>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">
            Land your graduate scheme.<br />
            Start practising today.
          </h2>
          <p className="text-lg mb-10 text-indigo-100">
            Join graduates who knew they were ready before they applied.
          </p>
          <Link href="/signup"
            className="inline-flex items-center gap-3 text-base font-bold px-10 py-5 rounded-2xl transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: "#FFFFFF", color: "#6366F1", boxShadow: "0 12px 48px rgba(0,0,0,0.2)" }}>
            Start practising today
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-4 text-xs" style={{ color: "rgba(196,181,253,0.7)" }}>£19.99/mo · Cancel any time · Initial launch pricing</p>
        </div>
      </section>

    </div>
  )
}

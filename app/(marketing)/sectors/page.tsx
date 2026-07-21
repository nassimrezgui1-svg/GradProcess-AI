"use client"
import Link from "next/link"
import { ArrowRight, Landmark, TrendingUp, Brain, BarChart3, Shield, Cpu, Scale, Wrench, ShoppingBag, Zap, Heart, Globe, Briefcase } from "lucide-react"

const sectors = [
  {
    name: "Investment Banking",
    slug: "investment-banking",
    color: "#818CF8",
    glow: "rgba(129,140,248,0.12)",
    icon: TrendingUp,
    description: "M&A advisory, capital markets, equity and debt issuance. High intensity, high reward graduate programmes at bulge brackets and boutiques.",
    tags: ["M&A", "DCF Modelling", "Capital Markets", "Pitchbooks"],
  },
  {
    name: "Consulting",
    slug: "consulting",
    color: "#5B8CFF",
    glow: "rgba(91,140,255,0.12)",
    icon: Brain,
    description: "Strategy, operations, and transformation consulting. MECE thinking, frameworks, and client impact at MBB and Big Four.",
    tags: ["Case Studies", "MECE", "Frameworks", "Strategy"],
  },
  {
    name: "Banking",
    slug: "banking",
    color: "#22D3EE",
    glow: "rgba(34,211,238,0.12)",
    icon: Landmark,
    description: "Retail, commercial, and corporate banking. Credit analysis, regulatory frameworks, and relationship management.",
    tags: ["Credit Analysis", "Risk", "Regulation", "Retail"],
  },
  {
    name: "Asset Management",
    slug: "asset-management",
    color: "#34D399",
    glow: "rgba(52,211,153,0.12)",
    icon: BarChart3,
    description: "Portfolio construction, fund management, and investment strategy across equity, fixed income, and alternatives.",
    tags: ["Portfolio", "Equities", "Fixed Income", "Funds"],
  },
  {
    name: "Technology",
    slug: "technology",
    color: "#38BDF8",
    glow: "rgba(56,189,248,0.12)",
    icon: Cpu,
    description: "Software engineering, product management, data science, and technical consulting at top tech firms and startups.",
    tags: ["Software", "Product", "Data Science", "Cloud"],
  },
  {
    name: "Wealth Management",
    slug: "wealth-management",
    color: "#A78BFA",
    glow: "rgba(167,139,250,0.12)",
    icon: Shield,
    description: "Private client advisory, financial planning, and relationship-based investment services at private banks and wealth managers.",
    tags: ["Private Clients", "Financial Planning", "HNW", "Advisory"],
  },
  {
    name: "Law",
    slug: "law",
    color: "#F472B6",
    glow: "rgba(244,114,182,0.12)",
    icon: Scale,
    description: "Corporate, finance, and litigation law. Solicitor training contracts and barrister pupillages at Magic Circle and US firms.",
    tags: ["Training Contract", "Corporate Law", "Finance", "Litigation"],
  },
  {
    name: "Insurance",
    slug: "insurance",
    color: "#FB923C",
    glow: "rgba(251,146,60,0.12)",
    icon: Briefcase,
    description: "Underwriting, actuarial science, claims, and risk management across life, general, and specialty insurance lines.",
    tags: ["Underwriting", "Actuarial", "Claims", "Risk"],
  },
  {
    name: "Engineering",
    slug: "engineering",
    color: "#FBBF24",
    glow: "rgba(251,191,36,0.12)",
    icon: Wrench,
    description: "Civil, mechanical, electrical, and chemical engineering graduate programmes at major infrastructure and industrial firms.",
    tags: ["Civil", "Mechanical", "Electrical", "Infrastructure"],
  },
  {
    name: "FMCG",
    slug: "fmcg",
    color: "#F97316",
    glow: "rgba(249,115,22,0.12)",
    icon: ShoppingBag,
    description: "Brand management, commercial, supply chain, and marketing at fast-moving consumer goods giants like Unilever and P&G.",
    tags: ["Brand Management", "Commercial", "Supply Chain", "Marketing"],
  },
  {
    name: "Energy",
    slug: "energy",
    color: "#4ADE80",
    glow: "rgba(74,222,128,0.12)",
    icon: Zap,
    description: "Oil & gas, renewables, utilities, and energy transition roles at major energy companies navigating decarbonisation.",
    tags: ["Renewables", "Oil & Gas", "Utilities", "Net Zero"],
  },
  {
    name: "Healthcare",
    slug: "healthcare",
    color: "#FB7185",
    glow: "rgba(251,113,133,0.12)",
    icon: Heart,
    description: "Pharmaceutical, medical devices, NHS leadership programmes, and healthcare consulting across clinical and commercial paths.",
    tags: ["Pharma", "NHS", "Medical Devices", "Consulting"],
  },
  {
    name: "Public Sector",
    slug: "public-sector",
    color: "#C084FC",
    glow: "rgba(192,132,252,0.12)",
    icon: Globe,
    description: "Civil Service Fast Stream, NHS, and government graduate schemes. Policy development, operational delivery, and public leadership.",
    tags: ["Fast Stream", "Civil Service", "Policy", "NHS"],
  },
]

export default function SectorsPage() {
  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative pt-36 pb-20 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99,102,241,0.1), transparent 70%)" }} />
        <div className="relative max-w-4xl mx-auto">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: "#818CF8" }}>
            Sector coverage
          </p>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-5 leading-tight">
            13 sectors.{" "}
            <span style={{
              background: "linear-gradient(90deg, #818CF8, #22D3EE)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Deep preparation.
            </span>
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.45)" }}>
            Sector-specific content, commercial awareness drills, and tailored interview questions for every major graduate scheme category.
          </p>
        </div>
      </section>

      {/* ── Sector grid ── */}
      <section className="px-6 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sectors.map(sector => {
              const Icon = sector.icon
              return (
                <Link
                  key={sector.name}
                  href={`/sectors/${sector.slug}`}
                  className="group rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = sector.glow
                    e.currentTarget.style.borderColor = sector.color + "35"
                    e.currentTarget.style.boxShadow = `0 12px 40px ${sector.glow}`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)"
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"
                    e.currentTarget.style.boxShadow = "none"
                  }}
                >
                  {/* Icon row */}
                  <div className="flex items-start justify-between">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300"
                      style={{ background: sector.glow, border: `1px solid ${sector.color}25` }}>
                      <Icon className="w-5 h-5" style={{ color: sector.color }} />
                    </div>
                    <ArrowRight
                      className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-1 group-hover:translate-x-0"
                      style={{ color: sector.color }}
                    />
                  </div>

                  {/* Text */}
                  <div className="flex-1">
                    <h3 className="font-bold text-white mb-2">{sector.name}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                      {sector.description}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {sector.tags.map(tag => (
                      <span key={tag}
                        className="text-[10px] font-semibold px-2.5 py-1 rounded-lg"
                        style={{
                          background: sector.glow,
                          color: sector.color,
                          border: `1px solid ${sector.color}20`,
                        }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-28 px-6 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #0EA5E9 100%)" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(255,255,255,0.1), transparent 60%)" }} />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
            Access all 13 sectors.
          </h2>
          <p className="text-lg text-indigo-100 mb-10">
            Commercial awareness quizzes, sector-specific interview questions, and trend briefings — all included at £19.99/mo.
          </p>
          <Link href="/signup"
            className="inline-flex items-center gap-3 text-base font-bold px-10 py-5 rounded-2xl transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: "#FFFFFF", color: "#6366F1", boxShadow: "0 12px 48px rgba(0,0,0,0.2)" }}>
            Get started <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}

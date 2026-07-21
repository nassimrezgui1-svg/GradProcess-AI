import Link from "next/link"
import { sectorContent, sectors } from "@/lib/mock-data"
import { TrendingUp, Users, Code, Award, MessageSquare, ArrowRight, ArrowLeft, BookOpen } from "lucide-react"

interface PageProps {
  params: Promise<{ sector: string }>
}

const sectorColors: Record<string, { hex: string; glow: string }> = {
  "investment-banking": { hex: "#818CF8", glow: "rgba(129,140,248,0.12)" },
  "consulting":         { hex: "#5B8CFF", glow: "rgba(91,140,255,0.12)"  },
  "banking":            { hex: "#22D3EE", glow: "rgba(34,211,238,0.12)"  },
  "asset-management":   { hex: "#34D399", glow: "rgba(52,211,153,0.12)"  },
  "technology":         { hex: "#38BDF8", glow: "rgba(56,189,248,0.12)"  },
  "wealth-management":  { hex: "#A78BFA", glow: "rgba(167,139,250,0.12)" },
  "law":                { hex: "#F472B6", glow: "rgba(244,114,182,0.12)" },
  "insurance":          { hex: "#FB923C", glow: "rgba(251,146,60,0.12)"  },
  "engineering":        { hex: "#FBBF24", glow: "rgba(251,191,36,0.12)"  },
  "fmcg":               { hex: "#F97316", glow: "rgba(249,115,22,0.12)"  },
  "energy":             { hex: "#4ADE80", glow: "rgba(74,222,128,0.12)"  },
  "healthcare":         { hex: "#FB7185", glow: "rgba(251,113,133,0.12)" },
  "public-sector":      { hex: "#C084FC", glow: "rgba(192,132,252,0.12)" },
}

const SLUG_TO_KEY: Record<string, string> = {
  "management-consulting": "consulting",
  "consulting":            "consulting",
  "banking":               "banking",
  "banking-financial-services": "banking",
  "investment-banking":    "investmentbanking",
  "asset-management":      "assetmanagement",
  "wealth-management":     "wealthmanagement",
  "technology":            "technology",
  "law":                   "law",
  "insurance":             "insurance",
  "fmcg":                  "fmcg",
  "energy":                "energy",
  "healthcare":            "healthcare",
  "public-sector":         "publicsector",
  "engineering":           "engineering",
}

function getSectorKey(slug: string): string {
  return SLUG_TO_KEY[slug] ?? slug
}

export async function generateStaticParams() {
  return sectors.map(s => ({ sector: s.toLowerCase().replace(/ /g, "-") }))
}

export default async function SectorPage({ params }: PageProps) {
  const { sector: slug } = await params
  const key = getSectorKey(slug)
  const data = sectorContent[key]
  const accent = sectorColors[slug] ?? { hex: "#818CF8", glow: "rgba(129,140,248,0.12)" }

  const sectorName = slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")

  const glassCard = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  }

  return (
    <div>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-16 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse 70% 60% at 20% 50%, ${accent.glow}, transparent 70%)` }} />

        <div className="relative max-w-7xl mx-auto">
          <Link href="/sectors"
            className="inline-flex items-center gap-2 text-sm mb-8 transition-colors"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            <ArrowLeft className="w-4 h-4" /> All Sectors
          </Link>

          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: accent.glow, border: `1px solid ${accent.hex}30` }}>
              <BookOpen className="w-6 h-6" style={{ color: accent.hex }} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: accent.hex }}>
              Sector Guide
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">
            {data?.name || sectorName}
          </h1>

          {data?.overview && (
            <p className="text-lg max-w-3xl leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
              {data.overview}
            </p>
          )}
        </div>
      </section>

      {/* ── Content ── */}
      {data ? (
        <section className="px-6 pb-20">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Trends */}
            <div className="rounded-2xl p-6" style={glassCard}>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.2)" }}>
                  <TrendingUp className="w-4 h-4" style={{ color: "#22D3EE" }} />
                </div>
                <h3 className="font-bold text-white">Current Trends</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.trends.map(t => (
                  <span key={t}
                    className="text-xs font-medium px-3 py-1.5 rounded-full"
                    style={{ background: "rgba(34,211,238,0.08)", color: "#22D3EE", border: "1px solid rgba(34,211,238,0.18)" }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Graduate roles */}
            <div className="rounded-2xl p-6" style={glassCard}>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: accent.glow, border: `1px solid ${accent.hex}25` }}>
                  <Users className="w-4 h-4" style={{ color: accent.hex }} />
                </div>
                <h3 className="font-bold text-white">Graduate Roles</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.graduateRoles.map(r => (
                  <span key={r}
                    className="text-xs font-medium px-3 py-1.5 rounded-full"
                    style={{ background: accent.glow, color: accent.hex, border: `1px solid ${accent.hex}20` }}>
                    {r}
                  </span>
                ))}
              </div>
            </div>

            {/* Technical areas */}
            <div className="rounded-2xl p-6" style={glassCard}>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(251,191,36,0.10)", border: "1px solid rgba(251,191,36,0.2)" }}>
                  <Code className="w-4 h-4" style={{ color: "#FBBF24" }} />
                </div>
                <h3 className="font-bold text-white">Technical Areas</h3>
              </div>
              <ul className="space-y-2.5">
                {data.technicalAreas.map(a => (
                  <li key={a} className="flex items-center gap-3 text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: "#FBBF24", boxShadow: "0 0 6px #FBBF24" }} />
                    {a}
                  </li>
                ))}
              </ul>
            </div>

            {/* Certifications */}
            <div className="rounded-2xl p-6" style={glassCard}>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(167,139,250,0.10)", border: "1px solid rgba(167,139,250,0.2)" }}>
                  <Award className="w-4 h-4" style={{ color: "#A78BFA" }} />
                </div>
                <h3 className="font-bold text-white">Relevant Certifications</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.certifications.map(c => (
                  <span key={c}
                    className="text-xs font-medium px-3 py-1.5 rounded-full"
                    style={{ background: "rgba(167,139,250,0.10)", color: "#A78BFA", border: "1px solid rgba(167,139,250,0.2)" }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Interview questions */}
            <div className="rounded-2xl p-6 md:col-span-2" style={glassCard}>
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(52,211,153,0.10)", border: "1px solid rgba(52,211,153,0.2)" }}>
                  <MessageSquare className="w-4 h-4" style={{ color: "#34D399" }} />
                </div>
                <h3 className="font-bold text-white">Sector-Specific Interview Questions</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.interviewQuestions.map((q, i) => (
                  <div key={i}
                    className="flex items-start gap-3 p-4 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 text-white"
                      style={{ background: accent.glow, border: `1px solid ${accent.hex}30`, color: accent.hex }}>
                      {i + 1}
                    </span>
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{q}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>
      ) : (
        /* No content yet */
        <section className="py-24 px-6">
          <div className="max-w-xl mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: accent.glow, border: `1px solid ${accent.hex}25` }}>
              <BookOpen className="w-8 h-8" style={{ color: accent.hex }} />
            </div>
            <h2 className="text-2xl font-black text-white mb-3">Content Coming Soon</h2>
            <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.45)" }}>
              Full sector content for <span className="text-white font-semibold">{sectorName}</span> is being developed. Sign up to be notified when it launches.
            </p>
            <Link href="/signup"
              className="inline-flex items-center gap-2 text-sm font-bold text-white px-6 py-3 rounded-xl transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", boxShadow: "0 4px 20px rgba(99,102,241,0.35)" }}>
              Get notified <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="relative py-24 px-6 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #0EA5E9 100%)" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(255,255,255,0.1), transparent 60%)" }} />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Practice {data?.name || sectorName} interviews with AI.
          </h2>
          <p className="text-indigo-100 mb-8">
            Sector-specific questions, commercial awareness drills, and live AI feedback — £19.99/mo.
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

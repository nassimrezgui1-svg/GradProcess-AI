"use client"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle, ArrowRight, Zap, Loader2, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { PLANS, ANNUAL_SAVING, ANNUAL_SAVING_PCT, formatPrice, type PlanKey } from "@/lib/plans"

const features = [
  "Unlimited CV scans with ATS scoring",
  "All psychometric test types — numerical, verbal, logical, abstract, SJT, attention to detail",
  "AI video interview practice & full delivery scoring",
  "STAR answer builder — all 23 competencies",
  "Full 9-stage process simulation exam",
  "13 sector industry hubs with commercial awareness drills",
  "Weekly readiness reports & progress analytics",
  "AI coach Ava — available 24/7",
  "Application tracker (unlimited roles)",
  "Score benchmarking vs graduate applicant pool",
]

const faqs = [
  {
    q: "Can I cancel at any time?",
    a: "Yes — cancel any time from your account settings. You keep access until the end of your current billing period. No penalties, no questions.",
  },
  {
    q: "Is this the launch price?",
    a: "Yes. £19.99/month is our initial launch fee. We may increase pricing after the launch period — subscribers locked in now keep their current rate.",
  },
  {
    q: "What is the difference between monthly and annual?",
    a: "Both give you exactly the same full access — only the billing period differs. Annual is £215.88 up front, which works out at £17.99 a month and saves you £24.00 against paying monthly for a year.",
  },
  {
    q: "Do you have a discount code?",
    a: "If you have a code, enter it on this page or at checkout and the discount is shown before you pay. Our launch code gives 50% off your first month on the monthly plan.",
  },
  {
    q: "Can I switch between monthly and annual later?",
    a: "Yes. Open the billing portal from your account and change plan there — Stripe prorates the difference automatically.",
  },
  {
    q: "Do you offer refunds?",
    a: "We offer a full refund within 7 days of your first payment if you're not satisfied — no questions asked.",
  },
  {
    q: "Is there a university or careers service plan?",
    a: "Yes — contact us at support@gradprocessai.com and we'll put together a cohort package for your careers service.",
  },
]

function PricingContent() {
  const params = useSearchParams()
  const gated = params.get("gate") === "1"
  const cancelled = params.get("checkout") === "cancelled"

  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [subActive, setSubActive] = useState(false)
  const [plan, setPlan] = useState<PlanKey>(params.get("plan") === "annual" ? "annual" : "monthly")
  const [promo, setPromo] = useState("")
  const [checkoutError, setCheckoutError] = useState("")

  const selected = PLANS[plan]

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUser(user)
      const { data } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("user_id", user.id)
        .single()
      if (data?.status === "active" || data?.status === "trialing") setSubActive(true)
    })
  }, [])

  async function handleCheckout() {
    if (!user) {
      // Carry the chosen plan through signup so it survives the round trip.
      window.location.href = `/signup?next=${encodeURIComponent(`/pricing?plan=${plan}`)}`
      return
    }
    if (subActive) {
      window.location.href = "/dashboard"
      return
    }
    setLoading(true)
    setCheckoutError("")
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, promoCode: promo.trim() || undefined }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
        return
      }
      setCheckoutError(data.error || "Could not start checkout. Please try again.")
    } catch {
      setCheckoutError("Could not reach the payment service. Please try again.")
    }
    setLoading(false)
  }

  const ctaLabel = subActive ? "Go to Dashboard" : user ? "Subscribe now" : "Get started"

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative pt-36 pb-20 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99,102,241,0.1), transparent 70%)" }} />
        <div className="relative max-w-3xl mx-auto">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: "#818CF8" }}>
            Simple pricing
          </p>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-5 leading-tight">
            One plan.{" "}
            <span style={{
              background: "linear-gradient(90deg, #818CF8, #22D3EE)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Full access.
            </span>
          </h1>
          <p className="text-lg" style={{ color: "rgba(255,255,255,0.45)" }}>
            No tiers. No feature limits. Everything you need to land your graduate scheme.
          </p>
        </div>
      </section>

      {/* ── Gated / cancelled banners ── */}
      {gated && (
        <div className="px-6 pb-6">
          <div className="max-w-2xl mx-auto flex items-center gap-3 rounded-2xl px-5 py-4"
            style={{ background: "rgba(251,113,133,0.08)", border: "1px solid rgba(251,113,133,0.2)" }}>
            <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: "#FB7185" }} />
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
              <span className="font-bold text-white">Subscription required.</span> Subscribe to access the full GradProcess AI platform.
            </p>
          </div>
        </div>
      )}
      {cancelled && (
        <div className="px-6 pb-6">
          <div className="max-w-2xl mx-auto flex items-center gap-3 rounded-2xl px-5 py-4"
            style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
            <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: "#FBBF24" }} />
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
              Payment cancelled — no charge was made. Subscribe whenever you&apos;re ready.
            </p>
          </div>
        </div>
      )}

      {/* ── Pricing card ── */}
      <section className="px-6 pb-24">
        <div className="max-w-2xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden"
            style={{ background: "linear-gradient(135deg, #6366F1 0%, #7C3AED 100%)", boxShadow: "0 32px 80px rgba(99,102,241,0.4)" }}>

            <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl pointer-events-none"
              style={{ background: "rgba(255,255,255,0.07)" }} />
            <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full blur-2xl pointer-events-none"
              style={{ background: "rgba(139,92,246,0.35)" }} />

            <div className="relative p-8 sm:p-12">
              <div className="inline-flex items-center gap-2 text-[10px] font-black tracking-widest uppercase px-3 py-1.5 rounded-full mb-8"
                style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)", border: "1px solid rgba(255,255,255,0.2)" }}>
                <Zap className="w-3 h-3" />
                Initial Launch Offer
              </div>

              {/* Billing period toggle */}
              <div className="inline-flex p-1 rounded-2xl mb-7"
                style={{ background: "rgba(0,0,0,0.18)", border: "1px solid rgba(255,255,255,0.14)" }}>
                {([
                  { key: "monthly" as const, label: "Monthly" },
                  { key: "annual" as const, label: `Annual · save ${ANNUAL_SAVING_PCT}%` },
                ]).map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setPlan(opt.key)}
                    aria-pressed={plan === opt.key}
                    className="px-5 py-2 rounded-xl text-sm font-bold transition-all"
                    style={plan === opt.key
                      ? { background: "#FFFFFF", color: "#6366F1" }
                      : { background: "transparent", color: "rgba(255,255,255,0.7)" }}>
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8 mb-8">
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-6xl font-black text-white tracking-tight">
                      {formatPrice(selected.perMonth)}
                    </span>
                    <span className="text-xl font-semibold" style={{ color: "rgba(196,181,253,0.8)" }}>/month</span>
                  </div>
                  <p style={{ color: "rgba(196,181,253,0.7)" }} className="text-sm">
                    {plan === "annual"
                      ? `Billed ${formatPrice(selected.amount)} a year — saves ${formatPrice(ANNUAL_SAVING)} against monthly`
                      : "Billed monthly · Cancel any time · No hidden fees"}
                  </p>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="flex-shrink-0 inline-flex items-center justify-center gap-2.5 text-base font-black px-9 py-4 rounded-2xl transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                  style={{ background: "#FFFFFF", color: "#6366F1", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
                  {loading
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : <><span>{ctaLabel}</span><ArrowRight className="w-5 h-5" /></>
                  }
                </button>
              </div>

              {/* Discount code */}
              {!subActive && (
                <div className="mb-8">
                  <label htmlFor="promo" className="block text-xs font-semibold mb-2"
                    style={{ color: "rgba(196,181,253,0.85)" }}>
                    Discount code (optional)
                  </label>
                  <input
                    id="promo"
                    value={promo}
                    onChange={e => setPromo(e.target.value.toUpperCase())}
                    placeholder="e.g. HALFPRICE"
                    autoCapitalize="characters"
                    spellCheck={false}
                    className="w-full sm:w-72 px-4 py-2.5 rounded-xl text-sm font-semibold tracking-wide outline-none transition-colors"
                    style={{
                      background: "rgba(0,0,0,0.2)",
                      border: "1px solid rgba(255,255,255,0.18)",
                      color: "#FFFFFF",
                    }}
                  />
                  <p className="text-xs mt-2" style={{ color: "rgba(196,181,253,0.6)" }}>
                    Applied at checkout — you will see the discount before you pay.
                  </p>
                </div>
              )}

              {checkoutError && (
                <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 mb-8"
                  style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.2)" }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-white" />
                  <p className="text-sm text-white">{checkoutError}</p>
                </div>
              )}

              <div className="mb-8" style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3.5">
                {features.map(f => (
                  <div key={f} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-white" />
                    <span className="text-sm leading-snug" style={{ color: "rgba(224,214,255,0.9)" }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-center mt-5 text-xs" style={{ color: "rgba(255,255,255,0.22)" }}>
            {plan === "annual"
              ? `${formatPrice(PLANS.annual.amount)} billed once a year · Existing subscribers keep their rate`
              : "Price may increase after the initial launch period · Existing subscribers keep their rate"}
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-2xl mx-auto">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-3 text-center" style={{ color: "#818CF8" }}>FAQ</p>
          <h2 className="text-3xl font-black text-white mb-10 text-center">Common questions</h2>
          <div className="space-y-4">
            {faqs.map(faq => (
              <div key={faq.q}
                className="rounded-2xl p-6"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <h4 className="font-bold text-white mb-2">{faq.q}</h4>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.52)" }}>{faq.a}</p>
              </div>
            ))}
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
            Start practising today.
          </h2>
          <p className="text-lg text-indigo-100 mb-10">
            {formatPrice(selected.perMonth)}/mo · Full access · Cancel any time.
          </p>
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="inline-flex items-center gap-3 text-base font-bold px-10 py-5 rounded-2xl transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            style={{ background: "#FFFFFF", color: "#6366F1", boxShadow: "0 12px 48px rgba(0,0,0,0.2)" }}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{ctaLabel} <ArrowRight className="w-5 h-5" /></>}
          </button>
        </div>
      </section>
    </div>
  )
}

export default function PricingPage() {
  return (
    <Suspense>
      <PricingContent />
    </Suspense>
  )
}

"use client"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { CreditCard, CheckCircle, AlertCircle, Loader2, ExternalLink, Calendar, ArrowRight } from "lucide-react"
import { PLANS, ANNUAL_SAVING, ANNUAL_SAVING_PCT, formatPrice, type PlanKey } from "@/lib/plans"

type Sub = {
  plan: string
  status: string
  billing_interval: "month" | "year" | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  stripe_subscription_id: string | null
}

export default function BillingPage() {
  const [sub, setSub] = useState<Sub | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState<PlanKey | null>(null)
  const [checkoutError, setCheckoutError] = useState("")

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from("subscriptions")
        .select("plan, status, billing_interval, current_period_end, cancel_at_period_end, stripe_subscription_id")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          setSub(data)
          setLoading(false)
        })
    })
  }, [])

  async function openPortal() {
    setPortalLoading(true)
    const res = await fetch("/api/stripe/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ returnUrl: window.location.href }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
    else setPortalLoading(false)
  }

  async function startCheckout(plan: PlanKey) {
    setCheckoutLoading(plan)
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    })
    const { url, error } = await res.json()
    if (url) window.location.href = url
    else {
      setCheckoutError(error || "Could not start checkout. Please try again.")
      setCheckoutLoading(null)
    }
  }

  const isActive = sub?.status === "active" || sub?.status === "trialing"
  const intervalLabel =
    sub?.billing_interval === "year" ? " · billed annually"
    : sub?.billing_interval === "month" ? " · billed monthly"
    : ""
  const periodEnd = sub?.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white mb-1">Billing</h1>
        <p style={{ color: "rgba(255,255,255,0.45)" }} className="text-sm">
          Manage your subscription and payment details.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#5B8CFF" }} />
        </div>
      ) : (
        <div className="space-y-4">

          {/* Status card */}
          <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: isActive ? "rgba(52,211,153,0.12)" : "rgba(251,113,133,0.12)", border: isActive ? "1px solid rgba(52,211,153,0.25)" : "1px solid rgba(251,113,133,0.25)" }}>
                  {isActive
                    ? <CheckCircle className="w-5 h-5" style={{ color: "#34D399" }} />
                    : <AlertCircle className="w-5 h-5" style={{ color: "#FB7185" }} />
                  }
                </div>
                <div>
                  <p className="font-bold text-white">
                    {isActive ? "Student Pro" : "No active plan"}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.62)" }}>
                    {isActive
                      ? periodEnd
                        // Only claim a date when Stripe has actually given us one —
                        // otherwise this rendered the literal string "Renews null".
                        ? sub?.cancel_at_period_end
                          ? `Cancels ${periodEnd}`
                          : `Renews ${periodEnd}${intervalLabel}`
                        : sub?.cancel_at_period_end
                          ? "Cancels at the end of the current period"
                          : `Active subscription${intervalLabel}`
                      : "Subscribe to access all features"
                    }
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold px-3 py-1.5 rounded-full"
                style={isActive
                  ? { background: "rgba(52,211,153,0.12)", color: "#34D399", border: "1px solid rgba(52,211,153,0.2)" }
                  : { background: "rgba(251,113,133,0.12)", color: "#FB7185", border: "1px solid rgba(251,113,133,0.2)" }
                }>
                {sub?.status ?? "inactive"}
              </span>
            </div>

            {isActive && periodEnd && (
              <div className="mt-5 pt-5 flex items-center gap-2 text-sm" style={{ borderTop: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.45)" }}>
                <Calendar className="w-4 h-4" />
                {sub?.cancel_at_period_end
                  ? `Access until ${periodEnd}`
                  : `Next billing date: ${periodEnd}`
                }
              </div>
            )}
          </div>

          {/* Plan details */}
          {isActive && (
            <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2.5 mb-4">
                <CreditCard className="w-4 h-4" style={{ color: "#5B8CFF" }} />
                <h3 className="font-bold text-white text-sm">Plan details</h3>
              </div>
              <div className="space-y-2.5 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                {[
                  "Unlimited CV scans with ATS scoring",
                  "All psychometric test types",
                  "AI video interview practice",
                  "STAR answer builder — all 23 competencies",
                  "Full 9-stage process simulation",
                  "13 sector industry hubs",
                  "AI coach Ava — 24/7",
                  "Application tracker (unlimited roles)",
                ].map(f => (
                  <div key={f} className="flex items-center gap-2.5">
                    <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#34D399" }} />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h3 className="font-bold text-white text-sm mb-4">
              {isActive ? "Manage subscription" : "Get access"}
            </h3>

            {isActive ? (
              <button onClick={openPortal} disabled={portalLoading}
                className="flex items-center gap-2.5 text-sm font-bold px-5 py-3 rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "rgba(91,140,255,0.15)", color: "#5B8CFF", border: "1px solid rgba(91,140,255,0.25)" }}>
                {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                Open billing portal
              </button>
            ) : (
              <div className="space-y-3">
                {(["annual", "monthly"] as PlanKey[]).map(key => {
                  const p = PLANS[key]
                  const isAnnual = key === "annual"
                  return (
                    <button
                      key={key}
                      onClick={() => startCheckout(key)}
                      disabled={checkoutLoading !== null}
                      className="w-full flex items-center justify-between gap-3 text-left px-5 py-4 rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
                      style={isAnnual
                        ? { background: "linear-gradient(135deg, #4F46E5, #7C3AED)", color: "#fff", boxShadow: "0 4px 20px rgba(99,102,241,0.35)" }
                        : { background: "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)" }}
                    >
                      <span>
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-black">
                            {formatPrice(p.perMonth)}<span className="font-semibold opacity-70">/month</span>
                          </span>
                          {isAnnual && (
                            <span className="text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full"
                              style={{ background: "rgba(255,255,255,0.22)" }}>
                              Save {ANNUAL_SAVING_PCT}%
                            </span>
                          )}
                        </span>
                        <span className="block text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.65)" }}>
                          {isAnnual
                            ? `Billed ${formatPrice(p.amount)} a year — saves ${formatPrice(ANNUAL_SAVING)}`
                            : "Billed monthly"}
                        </span>
                      </span>
                      {checkoutLoading === key
                        ? <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                        : <ArrowRight className="w-4 h-4 flex-shrink-0" />}
                    </button>
                  )
                })}
                {checkoutError && (
                  <div className="flex items-start gap-2 rounded-xl px-4 py-3"
                    style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#F87171" }} />
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.75)" }}>{checkoutError}</p>
                  </div>
                )}
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.62)" }}>
                  Have a discount code? Enter it at checkout, or on the{" "}
                  <a href="/pricing" className="underline" style={{ color: "#818CF8" }}>pricing page</a>.
                </p>
              </div>
            )}

            <p className="mt-3 text-xs" style={{ color: "rgba(255,255,255,0.62)" }}>
              {isActive
                ? "Cancel, update payment method, or download invoices via the billing portal."
                : "Full access · Cancel any time · 7-day refund guarantee"
              }
            </p>
          </div>

        </div>
      )}
    </div>
  )
}

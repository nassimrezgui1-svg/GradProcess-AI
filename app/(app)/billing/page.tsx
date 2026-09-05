"use client"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { CreditCard, CheckCircle, AlertCircle, Loader2, ExternalLink, Calendar, ArrowRight } from "lucide-react"

type Sub = {
  plan: string
  status: string
  current_period_end: string | null
  cancel_at_period_end: boolean
  stripe_subscription_id: string | null
}

export default function BillingPage() {
  const [sub, setSub] = useState<Sub | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from("subscriptions")
        .select("plan, status, current_period_end, cancel_at_period_end, stripe_subscription_id")
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

  async function startCheckout() {
    setCheckoutLoading(true)
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: "student_pro" }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
    else setCheckoutLoading(false)
  }

  const isActive = sub?.status === "active" || sub?.status === "trialing"
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
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {isActive
                      ? periodEnd
                        // Only claim a date when Stripe has actually given us one —
                        // otherwise this rendered the literal string "Renews null".
                        ? sub?.cancel_at_period_end
                          ? `Cancels ${periodEnd}`
                          : `Renews ${periodEnd}`
                        : sub?.cancel_at_period_end
                          ? "Cancels at the end of the current period"
                          : "Active subscription"
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
              <button onClick={startCheckout} disabled={checkoutLoading}
                className="flex items-center gap-2.5 text-sm font-black px-6 py-3.5 rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", color: "#fff", boxShadow: "0 4px 20px rgba(99,102,241,0.35)" }}>
                {checkoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Subscribe — £19.99/mo
              </button>
            )}

            <p className="mt-3 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
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

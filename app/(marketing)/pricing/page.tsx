import Link from "next/link"
import { CheckCircle, X, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

const plans = [
  {
    name: "Free",
    price: "£0",
    period: "forever",
    description: "Try GradProcess AI with no commitment",
    color: "border-gray-200",
    cta: "Get started free",
    ctaStyle: "bg-gray-900 text-white hover:bg-gray-800",
    features: [
      "1 CV scan",
      "5 STAR scenarios",
      "1 mini psychometric quiz",
      "Limited industry content (2 sectors)",
      "Basic progress dashboard",
    ],
  },
  {
    name: "Pro Student",
    price: "£19",
    yearlyPrice: "£149",
    period: "per month",
    description: "Everything you need to ace the application process",
    color: "border-blue-500",
    popular: true,
    cta: "Start Pro Student",
    ctaStyle: "bg-blue-600 text-white hover:bg-blue-700",
    features: [
      "Unlimited CV scans & ATS scoring",
      "Video interview practice (all modes)",
      "Psychometric practice (all 6 types)",
      "Sector preparation (all 13 sectors)",
      "STAR builder (all 23 competencies)",
      "Full progress dashboard & analytics",
      "Weekly readiness reports",
    ],
  },
  {
    name: "Premium",
    price: "£39",
    yearlyPrice: "£299",
    period: "per month",
    description: "For serious applicants targeting top-tier firms",
    color: "border-purple-400",
    cta: "Start Premium",
    ctaStyle: "bg-purple-600 text-white hover:bg-purple-700",
    features: [
      "Everything in Pro Student",
      "Full mock process exam (all 9 stages)",
      "Advanced video scoring (NLP analysis)",
      "Personalised improvement roadmap",
      "Final interview preparation module",
      "Unlimited practice sessions",
      "Priority support (24h response)",
    ],
  },
  {
    name: "University / Enterprise",
    price: "Custom",
    period: "per cohort",
    description: "For careers services and university partnerships",
    color: "border-teal-400",
    cta: "Contact us",
    ctaStyle: "bg-teal-600 text-white hover:bg-teal-700",
    features: [
      "Cohort analytics dashboard",
      "Admin portal with student management",
      "White-label option available",
      "Bulk licensing discounts",
      "Custom sector content",
      "Dedicated account manager",
      "SLA-backed support",
    ],
  },
]

const comparisonRows = [
  { feature: "CV scans", free: "1", pro: "Unlimited", premium: "Unlimited", enterprise: "Unlimited" },
  { feature: "STAR scenarios", free: "5", pro: "Unlimited", premium: "Unlimited", enterprise: "Unlimited" },
  { feature: "Psychometric tests", free: "1 type", pro: "All 6 types", premium: "All 6 types", enterprise: "All 6 types" },
  { feature: "Video interview practice", free: false, pro: true, premium: true, enterprise: true },
  { feature: "Sector coverage", free: "2 sectors", pro: "13 sectors", premium: "13 sectors", enterprise: "Custom" },
  { feature: "Full process exam", free: false, pro: false, premium: true, enterprise: true },
  { feature: "Advanced video scoring", free: false, pro: false, premium: true, enterprise: true },
  { feature: "Progress analytics", free: "Basic", pro: "Full", premium: "Full + roadmap", enterprise: "Cohort view" },
  { feature: "Admin/cohort dashboard", free: false, pro: false, premium: false, enterprise: true },
  { feature: "White-label", free: false, pro: false, premium: false, enterprise: true },
  { feature: "Support", free: "Email", pro: "Email", premium: "Priority (24h)", enterprise: "Dedicated manager" },
]

export default function PricingPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0a0f1e] to-[#1e293b] pt-32 pb-16 px-6 text-center">
        <h1 className="text-5xl font-bold text-white mb-4">Simple, honest pricing</h1>
        <p className="text-xl text-gray-300 max-w-xl mx-auto mb-4">
          Start for free. Upgrade when you need more. Cancel anytime.
        </p>
        <p className="text-sm text-gray-500">
          Pro Student: Save £79 with annual billing (£149/year) · Premium: Save £169/year (£299/year)
        </p>
      </section>

      {/* Plans */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map(plan => (
              <div
                key={plan.name}
                className={cn(
                  "bg-white rounded-2xl border-2 p-6 flex flex-col",
                  plan.color,
                  plan.popular && "shadow-xl"
                )}
              >
                {plan.popular && (
                  <div className="text-xs font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full text-center mb-4">
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  {plan.period && plan.price !== "Custom" && (
                    <span className="text-gray-400 text-sm ml-1">/{plan.period}</span>
                  )}
                  {plan.yearlyPrice && (
                    <p className="text-xs text-green-600 mt-1">or {plan.yearlyPrice}/year — save 2 months</p>
                  )}
                </div>
                <ul className="space-y-2 flex-1 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.name === "University / Enterprise" ? "#" : "/signup"}
                  className={cn(
                    "w-full text-center py-3 rounded-xl font-semibold text-sm transition-all",
                    plan.ctaStyle
                  )}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Full Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 pr-4 text-sm font-medium text-gray-500 w-48">Feature</th>
                  {["Free", "Pro Student", "Premium", "Enterprise"].map(p => (
                    <th key={p} className="text-center py-3 px-4 text-sm font-semibold text-gray-900">{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr key={row.feature} className={cn("border-b border-gray-100", i % 2 === 0 && "bg-gray-50/50")}>
                    <td className="py-3 pr-4 text-sm text-gray-700">{row.feature}</td>
                    {[row.free, row.pro, row.premium, row.enterprise].map((val, j) => (
                      <td key={j} className="text-center py-3 px-4">
                        {val === true ? (
                          <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                        ) : val === false ? (
                          <X className="w-4 h-4 text-gray-300 mx-auto" />
                        ) : (
                          <span className="text-sm text-gray-600">{val}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: "Can I switch plans?", a: "Yes, you can upgrade or downgrade at any time. Changes take effect at the next billing date." },
              { q: "Is there a student discount?", a: "All our plans are designed specifically for students. The Pro Student plan at £19/month is our standard student offering." },
              { q: "Do you offer refunds?", a: "Yes — we offer a full refund within 7 days of purchase if you're not satisfied." },
              { q: "How do I access the University/Enterprise plan?", a: "Contact us at hello@gradprocess.ai and we'll set up a demo for your careers service." },
            ].map(faq => (
              <div key={faq.q} className="bg-white rounded-2xl border border-gray-100 p-5">
                <h4 className="font-semibold text-gray-900 mb-2">{faq.q}</h4>
                <p className="text-sm text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-[#0a0f1e] to-[#1e293b] text-center">
        <h2 className="text-4xl font-bold text-white mb-4">Start free today</h2>
        <p className="text-gray-300 mb-8">No credit card required for the free tier</p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition-colors"
        >
          Get started free <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  )
}

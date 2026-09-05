"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { LogoFull } from "@/components/brand/logo"
import { createClient } from "@/lib/supabase/client"

function MarketingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  // null = still checking, so we don't flash "Log in" at a signed-in visitor.
  const [signedIn, setSignedIn] = useState<boolean | null>(null)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60)
    window.addEventListener("scroll", handler, { passive: true })
    return () => window.removeEventListener("scroll", handler)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => setSignedIn(Boolean(user)))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setSignedIn(Boolean(session?.user))
    )
    return () => sub.subscription.unsubscribe()
  }, [])

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={scrolled
        ? { background: "rgba(7,11,20,0.94)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.07)" }
        : { background: "transparent" }
      }
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/"><LogoFull iconSize={28} dark /></Link>

        <div className="hidden md:flex items-center gap-8">
          {[
            { href: "/features", label: "Features" },
            { href: "/pricing",  label: "Pricing" },
            { href: "/sectors",  label: "Sectors" },
          ].map(({ href, label }) => (
            <Link key={href} href={href}
              className="text-sm font-medium transition-colors"
              style={{ color: "rgba(255,255,255,0.55)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}>
              {label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {signedIn ? (
            <Link href="/dashboard"
              className="text-sm font-bold text-white px-5 py-2.5 rounded-xl transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", boxShadow: "0 4px 20px rgba(99,102,241,0.35)" }}>
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login"
                className="text-sm font-medium transition-colors px-3 py-2"
                style={{ color: "rgba(255,255,255,0.55)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}>
                Log in
              </Link>
              <Link href="/signup"
                className="text-sm font-bold text-white px-5 py-2.5 rounded-xl transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", boxShadow: "0 4px 20px rgba(99,102,241,0.35)" }}>
                Get Started
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen
            ? <X className="w-5 h-5" style={{ color: "rgba(255,255,255,0.8)" }} />
            : <Menu className="w-5 h-5" style={{ color: "rgba(255,255,255,0.8)" }} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden px-6 py-4 space-y-1 border-b"
          style={{ background: "rgba(7,11,20,0.97)", borderColor: "rgba(255,255,255,0.07)" }}>
          {[["Features", "/features"], ["Pricing", "/pricing"], ["Sectors", "/sectors"]].map(([l, h]) => (
            <Link key={h} href={h} className="block text-sm font-medium py-2.5" style={{ color: "rgba(255,255,255,0.6)" }}>{l}</Link>
          ))}
          <div className="pt-3 flex gap-3 mt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            {signedIn ? (
              <Link href="/dashboard" className="flex-1 text-center py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}>Go to Dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="flex-1 text-center py-2.5 rounded-xl text-sm font-medium"
                  style={{ border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)" }}>Log in</Link>
                <Link href="/signup" className="flex-1 text-center py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}>Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

function MarketingFooter() {
  return (
    <footer style={{ background: "#070B14", borderTop: "1px solid rgba(255,255,255,0.07)" }} className="pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4"><LogoFull iconSize={26} dark /></div>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.3)" }}>
              AI-powered graduate recruitment preparation for the UK&apos;s top schemes.
            </p>
          </div>
          {/* Only real destinations are listed. These previously all pointed at
              "#", so every footer link was a dead end. */}
          {[
            {
              title: "Product",
              links: [
                { label: "Features", href: "/features" },
                { label: "Pricing", href: "/pricing" },
                { label: "Sectors", href: "/sectors" },
              ],
            },
            {
              title: "Account",
              links: [
                { label: "Log in", href: "/login" },
                { label: "Create account", href: "/signup" },
                { label: "Dashboard", href: "/dashboard" },
              ],
            },
            {
              title: "Legal",
              links: [
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Service", href: "/terms" },
                { label: "How we use AI", href: "/ai-disclosure" },
              ],
            },
          ].map(col => (
            <div key={col.title}>
              <h4 className="text-white text-sm font-semibold mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map(l => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm transition-colors"
                      style={{ color: "rgba(255,255,255,0.3)" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                      onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.2)" }}>
            © {new Date().getFullYear()} GradProcess AI. All rights reserved.
          </p>
          {/* Social placeholders removed — they looked like links but went nowhere.
              A real contact route is more useful than three dead icons. */}
          <a href="mailto:support@gradprocessai.com" className="text-sm transition-colors"
            style={{ color: "rgba(255,255,255,0.2)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}>
            support@gradprocessai.com
          </a>
        </div>
      </div>
    </footer>
  )
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#070B14" }}>
      <MarketingNav />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  )
}

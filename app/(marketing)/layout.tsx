"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Menu, X } from "lucide-react"
import { LogoFull, LogoMark } from "@/components/brand/logo"

function MarketingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handler)
    return () => window.removeEventListener("scroll", handler)
  }, [])

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      scrolled ? "bg-white shadow-sm border-b border-gray-100" : "bg-transparent"
    )}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/">
          {scrolled
            ? <LogoFull iconSize={30} />
            : <LogoFull iconSize={30} dark />
          }
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {[
            { href: "/features", label: "Features" },
            { href: "/pricing", label: "Pricing" },
            { href: "/sectors", label: "Sectors" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn("text-sm font-medium transition-colors hover:opacity-80", scrolled ? "text-gray-600" : "text-gray-200")}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className={cn("text-sm font-medium transition-colors", scrolled ? "text-gray-700" : "text-gray-200")}
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Get Started Free
          </Link>
        </div>

        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen
            ? <X className={cn("w-5 h-5", scrolled ? "text-gray-700" : "text-white")} />
            : <Menu className={cn("w-5 h-5", scrolled ? "text-gray-700" : "text-white")} />
          }
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 px-6 py-4 space-y-3">
          {["/features", "/pricing", "/sectors"].map(href => (
            <Link key={href} href={href} className="block text-sm text-gray-700 font-medium py-2">
              {href.slice(1).charAt(0).toUpperCase() + href.slice(2)}
            </Link>
          ))}
          <div className="pt-2 flex gap-3">
            <Link href="/login" className="flex-1 text-center py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700">Log in</Link>
            <Link href="/signup" className="flex-1 text-center py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold">Get Started</Link>
          </div>
        </div>
      )}
    </nav>
  )
}

function MarketingFooter() {
  return (
    <footer className="bg-[#0a0f1e] border-t border-white/5 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <LogoFull iconSize={28} dark />
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              AI-powered graduate recruitment preparation for the UK&apos;s top schemes.
            </p>
          </div>
          <div>
            <h4 className="text-white text-sm font-semibold mb-3">Product</h4>
            <ul className="space-y-2">
              {["Features", "Pricing", "Sectors", "Demo"].map(l => (
                <li key={l}><Link href="#" className="text-gray-500 text-sm hover:text-gray-300 transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white text-sm font-semibold mb-3">Resources</h4>
            <ul className="space-y-2">
              {["Blog", "Graduate Guide", "CV Templates", "FAQ"].map(l => (
                <li key={l}><Link href="#" className="text-gray-500 text-sm hover:text-gray-300 transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white text-sm font-semibold mb-3">Company</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="text-gray-500 text-sm hover:text-gray-300 transition-colors">About</Link></li>
              <li><Link href="#" className="text-gray-500 text-sm hover:text-gray-300 transition-colors">Careers</Link></li>
              <li><Link href="/privacy" className="text-gray-500 text-sm hover:text-gray-300 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-gray-500 text-sm hover:text-gray-300 transition-colors">Terms</Link></li>
              <li><Link href="/ai-disclosure" className="text-gray-500 text-sm hover:text-gray-300 transition-colors">AI Disclosure</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-sm">© 2026 GradProcess AI Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4 text-gray-600 text-sm">
            <span>Twitter</span>
            <span>LinkedIn</span>
            <span>Instagram</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white">
      <MarketingNav />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  )
}

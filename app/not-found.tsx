import Link from "next/link"
import { Home, LayoutDashboard, ArrowLeft } from "lucide-react"
import { LogoFull } from "@/components/brand/logo"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: "#070B14" }}>

      <div className="absolute top-6 left-6">
        <Link href="/"><LogoFull iconSize={28} dark /></Link>
      </div>

      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: "#818CF8" }}>
        Error 404
      </p>

      <h1 className="text-4xl md:text-5xl font-black text-white mb-4 max-w-xl leading-tight">
        We couldn&apos;t find that page.
      </h1>

      <p className="text-sm leading-relaxed mb-10 max-w-md" style={{ color: "rgba(255,255,255,0.42)" }}>
        The link may be out of date, or the page may have moved. Everything below still works.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/dashboard"
          className="flex items-center justify-center gap-2 text-sm font-bold text-white px-6 py-3 rounded-xl transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", boxShadow: "0 4px 20px rgba(99,102,241,0.35)" }}>
          <LayoutDashboard className="w-4 h-4" />
          Go to dashboard
        </Link>
        <Link href="/"
          className="flex items-center justify-center gap-2 text-sm font-semibold px-6 py-3 rounded-xl transition-all"
          style={{ border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)" }}>
          <Home className="w-4 h-4" />
          Back to homepage
        </Link>
      </div>

      <div className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs"
        style={{ color: "rgba(255,255,255,0.3)" }}>
        {[
          { href: "/cv-tailoring", label: "CV Tailoring" },
          { href: "/star-builder", label: "STAR Builder" },
          { href: "/video-interview", label: "Video Interview" },
          { href: "/psychometric", label: "Psychometric Tests" },
          { href: "/pricing", label: "Pricing" },
        ].map(l => (
          <Link key={l.href} href={l.href} className="hover:text-white transition-colors">{l.label}</Link>
        ))}
      </div>

      <Link href="/login"
        className="mt-10 flex items-center gap-1.5 text-xs transition-colors hover:text-white"
        style={{ color: "rgba(255,255,255,0.25)" }}>
        <ArrowLeft className="w-3 h-3" /> Sign in to your account
      </Link>
    </div>
  )
}

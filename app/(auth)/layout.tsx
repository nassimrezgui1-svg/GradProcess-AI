import Link from "next/link"
import { LogoFull } from "@/components/brand/logo"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: "#070B14" }}>

      {/* Animated ambient orbs */}
      <div className="cosmo-bg-blue" aria-hidden />
      <div className="cosmo-bg-violet" aria-hidden />
      <div className="bg-grid absolute inset-0 opacity-100 pointer-events-none" aria-hidden />

      {/* Faint center radial */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden
        style={{ background: "radial-gradient(ellipse 70% 50% at 50% 40%, rgba(91,140,255,0.06) 0%, transparent 70%)" }} />

      {/* Logo */}
      <Link href="/" className="mb-8 relative z-10">
        <LogoFull iconSize={32} dark />
      </Link>

      {/* Content */}
      <div className="relative z-10 w-full">
        {children}
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-center relative z-10" style={{ color: "#334155" }}>
        By using GradProcess AI you agree to our{" "}
        <Link href="/terms" className="transition-colors hover:text-slate-400 underline">Terms</Link>{" "}
        and{" "}
        <Link href="/privacy" className="transition-colors hover:text-slate-400 underline">Privacy Policy</Link>.
      </p>
    </div>
  )
}

import Link from "next/link"
import { LogoFull } from "@/components/brand/logo"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8">
        <LogoFull iconSize={32} dark />
      </Link>
      {children}
      <p className="mt-8 text-xs text-gray-600 text-center">
        By using GradProcess AI you agree to our{" "}
        <Link href="/terms" className="underline hover:text-gray-400 transition-colors">Terms</Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline hover:text-gray-400 transition-colors">Privacy Policy</Link>.
      </p>
    </div>
  )
}

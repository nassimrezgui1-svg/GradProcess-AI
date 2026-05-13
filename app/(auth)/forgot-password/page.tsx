"use client"
import { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import Link from "next/link"
import { Mail, ArrowLeft, CheckCircle } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError("")

    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/settings/reset-password`,
    })

    setLoading(false)

    // Always show success — never confirm whether an email exists
    if (err && err.message.toLowerCase().includes("rate limit")) {
      setError("Too many requests. Please wait a few minutes before trying again.")
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: "#EEE9FF" }}>
            <CheckCircle className="w-7 h-7" style={{ color: "#6D5EF3" }} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Check your email</h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            If an account exists for <span className="font-medium text-gray-700">{email}</span>, you&apos;ll receive a password reset link shortly.
          </p>
          <p className="text-xs text-gray-400 mb-6">
            Didn&apos;t receive it? Check your spam folder, or wait a few minutes before trying again.
          </p>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 text-sm font-medium"
            style={{ color: "#6D5EF3" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: "#EEE9FF" }}>
            <Mail className="w-5 h-5" style={{ color: "#6D5EF3" }} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Forgot your password?</h1>
          <p className="text-sm text-gray-500 mt-1">
            Enter your email and we&apos;ll send a reset link.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Email address
            </label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@university.ac.uk"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all"
              style={{ "--tw-ring-color": "#6D5EF3" } as React.CSSProperties}
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#6D5EF3,#5B8DEF)" }}
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>

          <Link
            href="/login"
            className="flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to sign in
          </Link>
        </form>
      </div>
    </div>
  )
}

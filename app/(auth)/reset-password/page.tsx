"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import Link from "next/link"
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from "lucide-react"
import { PasswordStrength, getPasswordScore } from "@/components/ui/password-strength"

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // The /api/auth/callback route already exchanged the recovery code for a
  // session before redirecting here — this page just needs that session to
  // exist so updateUser() is allowed to run.
  const [checkingSession, setCheckingSession] = useState(true)
  const [hasSession, setHasSession] = useState(false)

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session)
      setCheckingSession(false)
    })
  }, [supabase])

  const isValid = getPasswordScore(password) === 5 && password === confirm

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    setLoading(true)
    setError("")

    const { error: err } = await supabase.auth.updateUser({ password })

    setLoading(false)
    if (err) {
      setError(err.message || "Could not update your password. The link may have expired — request a new one.")
      return
    }
    setDone(true)
    setTimeout(() => router.push("/dashboard"), 2000)
  }

  if (checkingSession) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
          <p className="text-sm text-gray-500">Verifying your reset link…</p>
        </div>
      </div>
    )
  }

  if (!hasSession) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Link expired or invalid</h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            This password reset link is no longer valid. Reset links expire after a set time and can only be used once.
          </p>
          <Link
            href="/forgot-password"
            className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-white px-5 py-2.5 rounded-xl transition-all"
            style={{ background: "linear-gradient(135deg,#5546D6,#3F6FD8)" }}
          >
            Request a new link
          </Link>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: "#EEE9FF" }}>
            <CheckCircle className="w-7 h-7" style={{ color: "#6D5EF3" }} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Password updated</h1>
          <p className="text-sm text-gray-500">Taking you to your dashboard…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: "#EEE9FF" }}>
            <Lock className="w-5 h-5" style={{ color: "#6D5EF3" }} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Set a new password</h1>
          <p className="text-sm text-gray-500 mt-1">Choose a strong password for your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">New password</label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                autoComplete="new-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{ "--tw-ring-color": "#6D5EF3" } as React.CSSProperties}
              />
              <button
                type="button"
                onClick={() => setShow(s => !s)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <PasswordStrength password={password} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Confirm new password</label>
            <input
              type={show ? "text" : "password"}
              autoComplete="new-password"
              required
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all"
              style={{ "--tw-ring-color": "#6D5EF3" } as React.CSSProperties}
            />
            {confirm && password !== confirm && (
              <p className="text-xs text-red-600 mt-1.5">Passwords do not match.</p>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !isValid}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#5546D6,#3F6FD8)" }}
          >
            {loading ? "Updating…" : "Update password"}
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

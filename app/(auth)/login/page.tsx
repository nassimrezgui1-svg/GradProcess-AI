"use client"
import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const MAX_ATTEMPTS = 5
const LOCKOUT_MS   = 15 * 60 * 1000

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const supabase = createClient()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [attempts, setAttempts] = useState(0)
  const [lockedUntil, setLocked] = useState<number | null>(null)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    const locked = sessionStorage.getItem("login_locked_until")
    if (locked) {
      const until = parseInt(locked, 10)
      if (Date.now() < until) setLocked(until)
      else sessionStorage.removeItem("login_locked_until")
    }
  }, [])

  useEffect(() => {
    if (!lockedUntil) return
    const tick = () => {
      const rem = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000))
      setCountdown(rem)
      if (rem === 0) { setLocked(null); sessionStorage.removeItem("login_locked_until") }
    }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [lockedUntil])

  const isLocked = !!lockedUntil && Date.now() < lockedUntil

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLocked || loading) return
    setError(""); setLoading(true)
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        const next = attempts + 1; setAttempts(next)
        if (next >= MAX_ATTEMPTS) {
          const until = Date.now() + LOCKOUT_MS
          setLocked(until); sessionStorage.setItem("login_locked_until", String(until))
          setError(`Too many failed attempts. Please wait ${LOCKOUT_MS / 60000} minutes before trying again.`)
        } else {
          setError("Email or password is incorrect.")
        }
        return
      }
      setAttempts(0)
      router.push(params.get("next") ?? "/dashboard"); router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally { setLoading(false) }
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="rounded-2xl p-8"
        style={{
          background: "rgba(11,16,32,0.82)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(91,140,255,0.06)",
        }}>

        <div className="text-center mb-7">
          <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-sm" style={{ color: "#64748B" }}>Sign in to your Career Operating System</p>
        </div>

        <button type="button" onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 rounded-xl py-3 text-sm font-medium transition-all mb-5"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "#94A3B8" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#E2E8F0" }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#94A3B8" }}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
          <span className="text-xs" style={{ color: "#334155" }}>or</span>
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
        </div>

        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl mb-4"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)" }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#F87171" }} />
            <p className="text-xs" style={{ color: "#FCA5A5" }}>{error}</p>
          </div>
        )}

        {isLocked && (
          <div className="p-3 rounded-xl mb-4 text-center"
            style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.18)" }}>
            <p className="text-xs font-medium" style={{ color: "#FCD34D" }}>
              Temporarily locked — try again in {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="block text-xs font-medium mb-2" style={{ color: "#64748B" }}>
              Email address
            </label>
            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="alex@university.ac.uk" required autoComplete="email" disabled={isLocked}
              className="input-dark disabled:opacity-40" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="text-xs font-medium" style={{ color: "#64748B" }}>Password</label>
              <Link href="/forgot-password" className="text-xs transition-colors" style={{ color: "#5B8CFF" }}>
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input id="password" type={showPwd ? "text" : "password"} value={password}
                onChange={e => setPassword(e.target.value)} required autoComplete="current-password" disabled={isLocked}
                className="input-dark pr-11 disabled:opacity-40" />
              <button type="button" onClick={() => setShowPwd(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: "#475569" }}
                aria-label={showPwd ? "Hide password" : "Show password"}>
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading || isLocked || !email || !password}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white btn-gradient mt-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : "Sign in"}
          </button>
        </form>

        <p className="text-center text-xs mt-6" style={{ color: "#475569" }}>
          Don't have an account?{" "}
          <Link href="/signup" className="font-medium" style={{ color: "#5B8CFF" }}>Create one free</Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

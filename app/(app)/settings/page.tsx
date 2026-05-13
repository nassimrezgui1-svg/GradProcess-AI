"use client"
import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Topbar } from "@/components/layout/topbar"
import { loadProfile, saveProfile, UserProfile } from "@/lib/profile"
import { PasswordStrength, getPasswordScore } from "@/components/ui/password-strength"
import { cn } from "@/lib/utils"
import {
  User, Target, Bell, CreditCard, Shield, Check, Zap, Lock,
  Download, Trash2, Eye, EyeOff, AlertCircle, Cookie, Database,
  LogOut, ChevronRight,
} from "lucide-react"

type Tab = "profile" | "target" | "notifications" | "subscription" | "security" | "privacy"

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "profile",       label: "Profile",       icon: <User className="w-4 h-4" /> },
  { id: "target",        label: "Target",        icon: <Target className="w-4 h-4" /> },
  { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
  { id: "subscription",  label: "Plan",          icon: <CreditCard className="w-4 h-4" /> },
  { id: "security",      label: "Security",      icon: <Lock className="w-4 h-4" /> },
  { id: "privacy",       label: "Privacy",       icon: <Shield className="w-4 h-4" /> },
]

function Field({ label, name, value, onChange, type = "text" }: {
  label: string; name: keyof UserProfile; value: string
  onChange: (name: keyof UserProfile, value: string) => void; type?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      <input
        type={type} value={value}
        onChange={e => onChange(name, e.target.value)}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent"
        style={{ "--tw-ring-color": "#6D5EF3" } as React.CSSProperties}
      />
    </div>
  )
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      role="switch" aria-checked={on} onClick={onToggle}
      className="w-10 h-5 rounded-full transition-colors flex items-center flex-shrink-0"
      style={{ backgroundColor: on ? "#6D5EF3" : "#D1D5DB" }}
    >
      <span
        className="w-4 h-4 bg-white rounded-full shadow transition-transform"
        style={{ transform: on ? "translateX(22px)" : "translateX(2px)" }}
      />
    </button>
  )
}

// ─── Security Tab ─────────────────────────────────────────────────────────────

function SecurityTab() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [sessions, setSessions] = useState<{ created_at: string; user_agent: string | null }[]>([])
  const [signOutLoading, setSignOutLoading] = useState(false)

  useEffect(() => {
    // Load active sessions (Supabase doesn't expose a sessions list endpoint for anon key;
    // show a placeholder that covers the current session at minimum)
    setSessions([{ created_at: new Date().toISOString(), user_agent: navigator.userAgent }])
  }, [])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwMsg(null)

    if (newPassword !== confirmPassword) {
      setPwMsg({ type: "error", text: "New passwords do not match." })
      return
    }
    if (getPasswordScore(newPassword) < 5) {
      setPwMsg({ type: "error", text: "New password does not meet all requirements." })
      return
    }

    setPwLoading(true)

    // Re-authenticate then update
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      setPwMsg({ type: "error", text: "Unable to verify your session. Please sign in again." })
      setPwLoading(false)
      return
    }

    // Verify current password via sign-in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })

    if (signInError) {
      setPwMsg({ type: "error", text: "Current password is incorrect." })
      setPwLoading(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    setPwLoading(false)

    if (updateError) {
      setPwMsg({ type: "error", text: "Failed to update password. Please try again." })
    } else {
      setPwMsg({ type: "success", text: "Password updated successfully." })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    }
  }

  const handleSignOutAll = async () => {
    setSignOutLoading(true)
    await supabase.auth.signOut({ scope: "global" })
    window.location.href = "/login"
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") return
    setDeleteLoading(true)
    // Account deletion requires the service role key — direct users to support
    // or implement via a dedicated server action with the service client
    await fetch("/api/account/delete", { method: "DELETE" })
    await supabase.auth.signOut()
    window.location.href = "/?deleted=1"
  }

  return (
    <div className="space-y-5">
      {/* Change password */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4" style={{ color: "#6D5EF3" }} />
          Change Password
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Current Password</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
                className="w-full px-4 py-3 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2"
                style={{ "--tw-ring-color": "#6D5EF3" } as React.CSSProperties}
              />
              <button type="button" onClick={() => setShowCurrent(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">New Password</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                className="w-full px-4 py-3 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2"
                style={{ "--tw-ring-color": "#6D5EF3" } as React.CSSProperties}
              />
              <button type="button" onClick={() => setShowNew(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <PasswordStrength password={newPassword} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": "#6D5EF3" } as React.CSSProperties}
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>

          {pwMsg && (
            <div className={cn("flex items-center gap-2 p-3 rounded-xl text-xs",
              pwMsg.type === "success"
                ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
                : "bg-red-50 border border-red-100 text-red-700"
            )}>
              {pwMsg.type === "success"
                ? <Check className="w-3.5 h-3.5 flex-shrink-0" />
                : <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />}
              {pwMsg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={pwLoading || !currentPassword || !newPassword || !confirmPassword}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#6D5EF3,#5B8DEF)" }}
          >
            {pwLoading ? "Updating…" : "Update Password"}
          </button>
        </form>
      </div>

      {/* Active sessions */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <LogOut className="w-4 h-4" style={{ color: "#6D5EF3" }} />
          Active Sessions
        </h3>
        <div className="space-y-2 mb-4">
          {sessions.map((s, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <p className="text-xs font-medium text-gray-700">
                  {i === 0 ? "Current session" : "Other session"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">
                  {s.user_agent ? s.user_agent.slice(0, 60) + "…" : "Unknown device"}
                </p>
              </div>
              {i === 0 && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  Active
                </span>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={handleSignOutAll}
          disabled={signOutLoading}
          className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
        >
          {signOutLoading ? "Signing out…" : "Sign out of all devices"}
        </button>
      </div>

      {/* Two-factor authentication (placeholder) */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="w-4 h-4" style={{ color: "#6D5EF3" }} />
              Two-Factor Authentication
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Add an extra layer of security to your account</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
            Coming soon
          </span>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-red-50 rounded-2xl border border-red-100 p-6">
        <h3 className="text-sm font-semibold text-red-700 mb-1 flex items-center gap-2">
          <Trash2 className="w-4 h-4" />
          Delete Account
        </h3>
        <p className="text-xs text-red-600 mb-4">
          Permanently deletes your account, all recordings, CVs, and personal data. This cannot be undone.
        </p>
        <div className="space-y-3">
          <input
            type="text"
            value={deleteConfirm}
            onChange={e => setDeleteConfirm(e.target.value)}
            placeholder='Type "DELETE" to confirm'
            className="w-full px-4 py-3 border border-red-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
          />
          <button
            onClick={handleDeleteAccount}
            disabled={deleteConfirm !== "DELETE" || deleteLoading}
            className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-40"
          >
            {deleteLoading ? "Deleting…" : "Permanently Delete My Account"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Privacy Tab ──────────────────────────────────────────────────────────────

function PrivacyTab() {
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [dataExportLoading, setDataExportLoading] = useState(false)
  const [exportDone, setExportDone] = useState(false)

  // Load from stored cookie consent
  useEffect(() => {
    try {
      const raw = localStorage.getItem("gradprocess_cookie_consent")
      if (raw) {
        const stored = JSON.parse(raw)
        setAnalytics(stored.analytics ?? false)
        setMarketing(stored.marketing ?? false)
      }
    } catch {}
  }, [])

  const saveCookiePrefs = () => {
    const settings = {
      preference: analytics || marketing ? "custom" : "essential",
      analytics,
      marketing,
      timestamp: new Date().toISOString(),
    }
    localStorage.setItem("gradprocess_cookie_consent", JSON.stringify(settings))
    document.cookie = `cookie_consent=${settings.preference}; max-age=${60 * 60 * 24 * 365}; path=/; SameSite=Strict`
  }

  const handleDataExport = async () => {
    setDataExportLoading(true)
    try {
      const res = await fetch("/api/account/export", { method: "GET" })
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `gradprocess-data-export-${new Date().toISOString().slice(0, 10)}.json`
        a.click()
        URL.revokeObjectURL(url)
        setExportDone(true)
      }
    } catch (e) {
      console.error("Export failed", e)
    }
    setDataExportLoading(false)
  }

  return (
    <div className="space-y-5">
      {/* Cookie preferences */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <Cookie className="w-4 h-4" style={{ color: "#6D5EF3" }} />
          Cookie Preferences
        </h3>
        <p className="text-xs text-gray-500 mb-5">Manage which cookies GradProcess AI may use.</p>
        <div className="space-y-4">
          {/* Essential — always on */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-700">Essential cookies</p>
              <p className="text-xs text-gray-400 mt-0.5">Authentication, security, and session management — always on</p>
            </div>
            <div className="w-10 h-5 rounded-full bg-emerald-500 flex items-center justify-end pr-0.5 flex-shrink-0">
              <span className="w-4 h-4 bg-white rounded-full shadow" />
            </div>
          </div>

          {/* Analytics */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-700">Analytics cookies</p>
              <p className="text-xs text-gray-400 mt-0.5">Understand how features are used so we can improve</p>
            </div>
            <Toggle on={analytics} onToggle={() => setAnalytics(a => !a)} />
          </div>

          {/* Marketing */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-700">Marketing cookies</p>
              <p className="text-xs text-gray-400 mt-0.5">Personalised content and advertising</p>
            </div>
            <Toggle on={marketing} onToggle={() => setMarketing(m => !m)} />
          </div>
        </div>

        <button
          onClick={saveCookiePrefs}
          className="mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: "linear-gradient(135deg,#6D5EF3,#5B8DEF)" }}
        >
          Save Cookie Preferences
        </button>
      </div>

      {/* Data & privacy */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <Database className="w-4 h-4" style={{ color: "#6D5EF3" }} />
          Your Data
        </h3>
        <p className="text-xs text-gray-500 mb-5">
          You own your data. Export or request deletion at any time under your GDPR rights.
        </p>
        <div className="space-y-3">
          <button
            onClick={handleDataExport}
            disabled={dataExportLoading}
            className="w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-colors text-sm"
          >
            <div className="flex items-center gap-3">
              <Download className="w-4 h-4 text-gray-500" />
              <div className="text-left">
                <p className="font-medium text-gray-700">Export my data</p>
                <p className="text-xs text-gray-400 mt-0.5">Download all your GradProcess data as JSON</p>
              </div>
            </div>
            {exportDone
              ? <Check className="w-4 h-4 text-emerald-500" />
              : dataExportLoading
                ? <span className="text-xs text-gray-400">Preparing…</span>
                : <ChevronRight className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </div>

      {/* Legal links */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Legal</h3>
        <div className="space-y-2">
          {[
            { label: "Privacy Policy",    href: "/privacy" },
            { label: "Terms of Service",  href: "/terms" },
            { label: "AI Use Disclosure", href: "/ai-disclosure" },
          ].map(({ label, href }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-colors text-sm text-gray-700 font-medium"
            >
              {label}
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("profile")
  const [saved, setSaved] = useState(false)
  const [profile, setProfile] = useState<UserProfile>({
    name: "", email: "", university: "", degree: "", graduationYear: "",
    targetSector: "", targetRole: "", targetCompanies: "",
  })

  useEffect(() => {
    setProfile(loadProfile())
  }, [])

  const handleChange = (name: keyof UserProfile, value: string) => {
    setProfile(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    saveProfile(profile)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const SaveButton = () => (
    <button
      onClick={handleSave}
      className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-colors"
      style={{ background: "linear-gradient(135deg,#6D5EF3,#5B8DEF)" }}
    >
      {saved ? <><Check className="w-4 h-4" />Saved!</> : "Save Changes"}
    </button>
  )

  return (
    <div className="flex flex-col min-h-full">
      <Topbar title="Settings" />
      <div className="flex-1 p-6">
        <div className="max-w-3xl">
          {/* Tab strip */}
          <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-6 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 flex-shrink-0 py-2 px-3 rounded-xl text-sm font-medium transition-all",
                  activeTab === tab.id
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {tab.icon}
                <span className="hidden sm:block">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Profile */}
          {activeTab === "profile" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <h3 className="text-base font-semibold text-gray-900">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Full Name"        name="name"           value={profile.name}           onChange={handleChange} />
                <Field label="Email"            name="email"          value={profile.email}          onChange={handleChange} type="email" />
                <Field label="University"       name="university"     value={profile.university}     onChange={handleChange} />
                <Field label="Degree"           name="degree"         value={profile.degree}         onChange={handleChange} />
                <Field label="Graduation Year"  name="graduationYear" value={profile.graduationYear} onChange={handleChange} />
              </div>
              <SaveButton />
            </div>
          )}

          {/* Target */}
          {activeTab === "target" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <h3 className="text-base font-semibold text-gray-900">Target Role Configuration</h3>
              <div className="space-y-4">
                <Field label="Target Sector"                      name="targetSector"    value={profile.targetSector}    onChange={handleChange} />
                <Field label="Target Role Title"                  name="targetRole"      value={profile.targetRole}      onChange={handleChange} />
                <Field label="Target Companies (comma-separated)" name="targetCompanies" value={profile.targetCompanies} onChange={handleChange} />
              </div>
              <SaveButton />
            </div>
          )}

          {/* Notifications */}
          {activeTab === "notifications" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <h3 className="text-base font-semibold text-gray-900">Notification Preferences</h3>
              <div className="space-y-3">
                {[
                  { label: "Weekly readiness score report", sub: "Every Monday morning", on: true },
                  { label: "Practice session reminders",    sub: "Daily at your preferred time", on: true },
                  { label: "Application deadline alerts",   sub: "For companies you're targeting", on: false },
                  { label: "New industry content",          sub: "When new sector content is available", on: false },
                  { label: "Product updates",               sub: "New features and improvements", on: true },
                ].map(n => (
                  <div key={n.label} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{n.label}</p>
                      <p className="text-xs text-gray-400">{n.sub}</p>
                    </div>
                    <Toggle on={n.on} onToggle={() => {}} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subscription */}
          {activeTab === "subscription" && (
            <div className="space-y-4">
              <div className="rounded-2xl p-6 text-white" style={{ background: "linear-gradient(135deg,#6D5EF3,#5B8DEF)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5" />
                  <span className="font-bold">Pro Student Plan</span>
                </div>
                <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.8)" }}>£19/month · Next billing: 9 June 2026</p>
                <div className="grid grid-cols-2 gap-2">
                  {["Unlimited CV scans", "Video interview practice", "All psychometric tests", "Sector preparation", "Progress dashboard"].map(f => (
                    <div key={f} className="flex items-center gap-1.5 text-xs">
                      <Check className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.7)" }} />
                      <span style={{ color: "rgba(255,255,255,0.9)" }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Upgrade to Premium</h3>
                <div className="space-y-2 mb-4">
                  {["Full mock application process", "Advanced video scoring", "Personalised improvement roadmap", "Final interview preparation", "Priority support"].map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-emerald-500" />{f}
                    </div>
                  ))}
                </div>
                <button className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold text-sm hover:bg-gray-800 transition-colors">
                  Upgrade to Premium — £39/month
                </button>
              </div>
            </div>
          )}

          {/* Security */}
          {activeTab === "security" && <SecurityTab />}

          {/* Privacy */}
          {activeTab === "privacy" && <PrivacyTab />}
        </div>
      </div>
    </div>
  )
}

"use client"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Cookie, X, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"

type CookiePreference = "essential" | "all" | "custom"

interface CookieSettings {
  preference: CookiePreference
  analytics: boolean
  marketing: boolean
  timestamp: string
}

const STORAGE_KEY = "gradprocess_cookie_consent"

function loadSettings(): CookieSettings | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveSettings(settings: CookieSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  // Also set a simple cookie flag for middleware/SSR
  document.cookie = `cookie_consent=${settings.preference}; max-age=${60 * 60 * 24 * 365}; path=/; SameSite=Strict`
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [customOpen, setCustomOpen] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    const stored = loadSettings()
    if (!stored) {
      // Show banner after a short delay so the page renders first
      const t = setTimeout(() => setVisible(true), 1200)
      return () => clearTimeout(t)
    }
  }, [])

  const accept = (preference: CookiePreference) => {
    const settings: CookieSettings = {
      preference,
      analytics: preference === "all" || (preference === "custom" && analytics),
      marketing: preference === "all" || (preference === "custom" && marketing),
      timestamp: new Date().toISOString(),
    }
    saveSettings(settings)
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="flex items-start gap-3 p-5 pb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#EEE9FF" }}>
                <Cookie className="w-4.5 h-4.5" style={{ color: "#6D5EF3" }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Cookie Preferences</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  We use essential cookies to keep the platform secure and working. Optional cookies help us improve the experience.{" "}
                  <Link href="/privacy" className="underline hover:text-gray-700 transition-colors">
                    Privacy Policy
                  </Link>
                </p>
              </div>
              <button
                onClick={() => accept("essential")}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                aria-label="Decline optional cookies"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Customise section */}
            <div className="px-5 pb-3">
              <button
                onClick={() => setCustomOpen(o => !o)}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                Customise preferences
                {customOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              <AnimatePresence>
                {customOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 space-y-2.5">
                      {/* Essential — always on */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-gray-700">Essential cookies</p>
                          <p className="text-xs text-gray-400">Authentication, security, session management</p>
                        </div>
                        <div className="w-9 h-5 rounded-full bg-emerald-500 flex items-center justify-end pr-0.5 flex-shrink-0">
                          <span className="w-4 h-4 bg-white rounded-full shadow" />
                        </div>
                      </div>

                      {/* Analytics */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-gray-700">Analytics cookies</p>
                          <p className="text-xs text-gray-400">Understand which features are used</p>
                        </div>
                        <button
                          role="switch"
                          aria-checked={analytics}
                          onClick={() => setAnalytics(a => !a)}
                          className="w-9 h-5 rounded-full transition-colors flex items-center flex-shrink-0"
                          style={{ backgroundColor: analytics ? "#6D5EF3" : "#E5E7EB" }}
                        >
                          <span className="w-4 h-4 bg-white rounded-full shadow ml-0.5 transition-transform" style={{ transform: analytics ? "translateX(16px)" : "translateX(0)" }} />
                        </button>
                      </div>

                      {/* Marketing */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-gray-700">Marketing cookies</p>
                          <p className="text-xs text-gray-400">Personalised ads and content</p>
                        </div>
                        <button
                          role="switch"
                          aria-checked={marketing}
                          onClick={() => setMarketing(m => !m)}
                          className="w-9 h-5 rounded-full transition-colors flex items-center flex-shrink-0"
                          style={{ backgroundColor: marketing ? "#6D5EF3" : "#E5E7EB" }}
                        >
                          <span className="w-4 h-4 bg-white rounded-full shadow ml-0.5 transition-transform" style={{ transform: marketing ? "translateX(16px)" : "translateX(0)" }} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="flex gap-2 px-5 pb-5">
              <button
                onClick={() => accept("essential")}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Essential only
              </button>
              {customOpen ? (
                <button
                  onClick={() => accept("custom")}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white transition-all"
                  style={{ background: "linear-gradient(135deg,#6D5EF3,#5B8DEF)" }}
                >
                  Save preferences
                </button>
              ) : (
                <button
                  onClick={() => accept("all")}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white transition-all"
                  style={{ background: "linear-gradient(135deg,#6D5EF3,#5B8DEF)" }}
                >
                  Accept all
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Video, Mic, Shield, Trash2, Download, Eye, AlertCircle, CheckCircle } from "lucide-react"

export interface RecordingConsentResult {
  consentGiven: boolean
  saveRecording: boolean
  saveTranscript: boolean
  enableAiFeedback: boolean
  timestamp: string
}

interface RecordingConsentModalProps {
  open: boolean
  onConsent: (result: RecordingConsentResult) => void
  onDecline: () => void
}

export function RecordingConsentModal({
  open,
  onConsent,
  onDecline,
}: RecordingConsentModalProps) {
  const [confirmed, setConfirmed] = useState(false)
  const [saveRecording, setSaveRecording] = useState(true)
  const [saveTranscript, setSaveTranscript] = useState(true)
  const [enableAi, setEnableAi] = useState(true)

  const handleConsent = () => {
    if (!confirmed) return
    onConsent({
      consentGiven: true,
      saveRecording,
      saveTranscript,
      enableAiFeedback: enableAi,
      timestamp: new Date().toISOString(),
    })
    // Persist consent to localStorage for session
    localStorage.setItem("gradprocess_recording_consent", JSON.stringify({
      granted: true,
      timestamp: new Date().toISOString(),
      version: "1.0",
      saveRecording,
      saveTranscript,
      enableAiFeedback: enableAi,
    }))
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100" style={{ background: "linear-gradient(135deg,#6D5EF3,#5B8DEF)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Recording Consent</h2>
                  <p className="text-xs text-white/80">Please review before your practice session</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              {/* What this session will do */}
              <div className="space-y-3">
                {[
                  { icon: Video,   text: "Your camera and microphone will be used for this practice session." },
                  { icon: Mic,     text: "Your audio will be transcribed in real-time to generate coaching feedback." },
                  { icon: Eye,     text: "AI will analyse your answers for content, delivery, and STAR structure." },
                  { icon: Shield,  text: "All recordings are private to your account. Nothing is shared or publicly accessible." },
                  { icon: Trash2,  text: "You can delete your recording, transcript, or full session at any time." },
                  { icon: Download,text: "You can download your recording or transcript from your Reports page." },
                ].map(({ icon: Icon, text }, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "#EEE9FF" }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: "#6D5EF3" }} />
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>

              {/* Privacy toggles */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-700 mb-3">Your data preferences</p>
                {[
                  { label: "Save video recording to my account", value: saveRecording, onChange: setSaveRecording },
                  { label: "Save transcript to my account",      value: saveTranscript, onChange: setSaveTranscript },
                  { label: "Enable AI feedback and scoring",     value: enableAi,       onChange: setEnableAi },
                ].map(({ label, value, onChange }) => (
                  <label key={label} className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-gray-600 pr-4">{label}</span>
                    <button
                      role="switch"
                      aria-checked={value}
                      onClick={() => onChange(!value)}
                      className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0"
                      style={{ backgroundColor: value ? "#6D5EF3" : "#D1D5DB" }}
                    >
                      <span
                        className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                        style={{ transform: value ? "translateX(22px)" : "translateX(2px)" }}
                      />
                    </button>
                  </label>
                ))}
              </div>

              {/* AI disclaimer */}
              <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  AI feedback is for interview preparation purposes only. Scores are guidance, not a prediction of interview outcomes. Body language analysis is experimental.
                </p>
              </div>

              {/* Confirmation checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div
                  onClick={() => setConfirmed(c => !c)}
                  className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                  style={{ borderColor: confirmed ? "#6D5EF3" : "#D1D5DB", backgroundColor: confirmed ? "#6D5EF3" : "white" }}
                >
                  {confirmed && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
                <span className="text-xs text-gray-700 leading-relaxed">
                  I consent to recording this practice session under the preferences above. I understand I can delete my data at any time.
                </span>
              </label>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={onDecline}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Decline — Text Only
              </button>
              <button
                onClick={handleConsent}
                disabled={!confirmed}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#6D5EF3,#5B8DEF)" }}
              >
                I Consent — Start Session
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

/** Read previously stored consent from localStorage */
export function getStoredConsent(): RecordingConsentResult | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem("gradprocess_recording_consent")
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

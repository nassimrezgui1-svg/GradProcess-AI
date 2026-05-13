"use client"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Loader2, Sparkles, ChevronDown, Lightbulb, TrendingUp, Zap } from "lucide-react"
import { loadDashboardScores } from "@/lib/scores"
import { loadProfile } from "@/lib/profile"
import { cn } from "@/lib/utils"

interface Message { role: "ava" | "user"; text: string }

function buildContext() {
  try {
    const s = loadDashboardScores()
    const p = loadProfile()
    const parts: string[] = []
    if (p.name) parts.push(`User: ${p.name}`)
    if (s.overall !== null) parts.push(`Overall: ${s.overall}/100`)
    if (s.cv !== null) parts.push(`CV: ${s.cv}`)
    if (s.psychometric !== null) parts.push(`Psychometric: ${s.psychometric}`)
    if (s.star !== null) parts.push(`STAR: ${s.star}`)
    if (s.video !== null) parts.push(`Video: ${s.video}`)
    if (s.weakest) parts.push(`Weakest: ${s.weakest.label} (${s.weakest.score})`)
    return parts.join(". ")
  } catch { return "" }
}

function getInsight(): string {
  try {
    const s = loadDashboardScores()
    if (s.cv === null && s.psychometric === null) return "Start with your CV — it takes 2 minutes and unlocks your personalised readiness score."
    if (s.weakest && s.weakest.score < 65) return `Your ${s.weakest.label} score (${s.weakest.score}) is your biggest opportunity right now. Let's work on it.`
    if (s.overall !== null && s.overall >= 75) return `You're at ${s.overall}/100 — that's application-ready territory. Let's push you higher.`
    return "Consistent daily practice is what separates offer-holders from the rest. What shall we work on?"
  } catch { return "Ask me anything about your preparation journey." }
}

const QUICK = ["What should I focus on today?", "How do I improve my ATS score?", "What makes a great STAR answer?"]

export function AvaCoach() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Listen for topbar "Ask Ava" button
  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener("open-ava", handler)
    return () => window.removeEventListener("open-ava", handler)
  }, [])

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: "ava", text: getInsight() }])
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    setMessages(p => [...p, { role: "user", text: text.trim() }])
    setInput("")
    setLoading(true)
    try {
      const res = await fetch("/api/ai/ava-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), context: buildContext(), history: messages.slice(-6) }),
      })
      const data = await res.json()
      setMessages(p => [...p, { role: "ava", text: data.reply || "Let me think on that." }])
    } catch {
      setMessages(p => [...p, { role: "ava", text: "I'm having trouble connecting right now — try again in a moment." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          onClick={() => setOpen(o => !o)}
          className="w-13 h-13 rounded-2xl bg-gradient-to-br from-brand-purple to-brand-blue shadow-purple flex items-center justify-center hover:scale-105 active:scale-95 transition-transform relative"
          style={{ width: 52, height: 52 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <AnimatePresence mode="wait">
            {open
              ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X className="w-5 h-5 text-white" /></motion.div>
              : <motion.div key="s" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Sparkles className="w-5 h-5 text-white" /></motion.div>
            }
          </AnimatePresence>
          {!open && <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />}
        </motion.button>
      </div>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed bottom-24 right-6 z-50 w-[360px] max-h-[540px] bg-white border border-surface-border rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-surface-border bg-gradient-to-r from-brand-purple-light to-brand-blue-light">
              <div className="relative">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-purple to-brand-blue flex items-center justify-center shadow-purple">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-ink">Ava</p>
                <p className="text-xs text-emerald-600 font-medium">AI Career Coach · Online</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-ink-faint hover:text-ink-muted transition-colors">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                  className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
                >
                  {msg.role === "ava" && (
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-purple to-brand-blue flex items-center justify-center flex-shrink-0 mr-2 mt-0.5 shadow-purple">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className={cn(
                    "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    msg.role === "ava"
                      ? "bg-surface-muted border border-surface-border text-ink rounded-tl-sm"
                      : "bg-gradient-to-br from-brand-purple to-brand-blue text-white rounded-tr-sm"
                  )}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-purple to-brand-blue flex items-center justify-center flex-shrink-0 shadow-purple">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <div className="bg-surface-muted border border-surface-border rounded-2xl rounded-tl-sm px-3.5 py-2.5 flex gap-1">
                    {[0,1,2].map(i => (
                      <motion.div key={i} className="w-1.5 h-1.5 bg-ink-faint rounded-full"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.14 }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick prompts */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                {QUICK.map(p => (
                  <button key={p} onClick={() => send(p)}
                    className="flex-shrink-0 text-xs bg-surface-muted border border-surface-border text-ink-muted hover:text-ink hover:border-brand-purple/30 hover:bg-brand-purple-light/50 px-3 py-1.5 rounded-full transition-all whitespace-nowrap">
                    {p}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-surface-border">
              <div className="flex items-center gap-2 bg-surface-muted border border-surface-border rounded-2xl px-3 py-2 focus-within:border-brand-purple/40 focus-within:ring-2 focus-within:ring-brand-purple/10 transition-all">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && send(input)}
                  placeholder="Ask Ava anything…"
                  className="flex-1 bg-transparent text-sm text-ink placeholder-ink-faint outline-none"
                />
                <button onClick={() => send(input)} disabled={!input.trim() || loading}
                  className="w-7 h-7 bg-gradient-to-br from-brand-purple to-brand-blue rounded-xl flex items-center justify-center disabled:opacity-30 hover:opacity-90 transition-opacity shadow-purple flex-shrink-0">
                  {loading ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Send className="w-3.5 h-3.5 text-white" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

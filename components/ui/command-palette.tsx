"use client"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import {
  Search, FileText, Mic2, Video, Brain, BookOpen, ClipboardList,
  BarChart3, Settings, Sparkles, Zap, TrendingUp, ArrowRight
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Command {
  id: string; label: string; description: string
  icon: React.ReactNode; action: () => void; category: string
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const go = (href: string) => { router.push(href); setOpen(false) }

  const commands: Command[] = [
    { id: "cv",          label: "Analyse my CV",              description: "Upload your CV and get an ATS score",               icon: <FileText className="w-4 h-4" />,    action: () => go("/cv-tailoring"),       category: "Modules" },
    { id: "star",        label: "Build a STAR answer",        description: "Generate a competency answer from your experience", icon: <Mic2 className="w-4 h-4" />,       action: () => go("/star-builder"),       category: "Modules" },
    { id: "video",       label: "Start a mock interview",     description: "Record and review a video interview response",      icon: <Video className="w-4 h-4" />,      action: () => go("/video-interview"),    category: "Modules" },
    { id: "psych",       label: "Practise psychometric test", description: "Numerical, verbal, logical and more",               icon: <Brain className="w-4 h-4" />,      action: () => go("/psychometric"),       category: "Modules" },
    { id: "industry",    label: "Read market briefing",       description: "Live sector news and commercial awareness",         icon: <BookOpen className="w-4 h-4" />,   action: () => go("/industry-hub"),       category: "Modules" },
    { id: "fullprocess", label: "Simulate full process",      description: "End-to-end graduate application simulation",        icon: <ClipboardList className="w-4 h-4" />, action: () => go("/full-process-exam"), category: "Modules" },
    { id: "dashboard",   label: "Go to Dashboard",            description: "Your progress overview",                            icon: <TrendingUp className="w-4 h-4" />, action: () => go("/dashboard"),          category: "Navigate" },
    { id: "reports",     label: "View my progress",           description: "Detailed analytics and score trends",               icon: <BarChart3 className="w-4 h-4" />,  action: () => go("/reports"),            category: "Navigate" },
    { id: "settings",    label: "Settings",                   description: "Update your profile and target companies",          icon: <Settings className="w-4 h-4" />,   action: () => go("/settings"),           category: "Navigate" },
    { id: "ava",         label: "Ask Ava",                    description: "Get coaching from your AI career advisor",          icon: <Sparkles className="w-4 h-4" />,   action: () => setOpen(false),            category: "AI Coach" },
    { id: "weaknesses",  label: "See my weaknesses",          description: "Find out where to focus your energy",               icon: <Zap className="w-4 h-4" />,        action: () => go("/reports"),            category: "AI Coach" },
  ]

  const filtered = query.trim()
    ? commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()) || c.description.toLowerCase().includes(query.toLowerCase()))
    : commands

  const categories = [...new Set(filtered.map(c => c.category))]

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen(o => !o) }
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  useEffect(() => {
    if (open) { setQuery(""); setSelected(0); setTimeout(() => inputRef.current?.focus(), 50) }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)) }
      if (e.key === "ArrowUp")   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
      if (e.key === "Enter")     { e.preventDefault(); filtered[selected]?.action() }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, filtered, selected])

  let idx = 0

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-[100]" />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ type: "spring", damping: 28, stiffness: 380 }}
            className="fixed top-[18%] left-1/2 -translate-x-1/2 w-full max-w-[520px] z-[101] bg-white border border-surface-border rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] overflow-hidden"
          >
            {/* Search */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-surface-border">
              <Search className="w-4 h-4 text-ink-faint flex-shrink-0" />
              <input ref={inputRef} value={query}
                onChange={e => { setQuery(e.target.value); setSelected(0) }}
                placeholder="Search actions or modules…"
                className="flex-1 bg-transparent text-sm text-ink placeholder-ink-faint outline-none"
              />
              <kbd className="text-xs text-ink-faint bg-surface-muted border border-surface-border rounded-lg px-1.5 py-0.5 font-mono">ESC</kbd>
            </div>

            {/* Results */}
            <div className="max-h-72 overflow-y-auto py-2">
              {filtered.length === 0
                ? <div className="px-4 py-8 text-center text-ink-muted text-sm">No results for "{query}"</div>
                : categories.map(cat => {
                    const items = filtered.filter(c => c.category === cat)
                    return (
                      <div key={cat}>
                        <p className="px-4 py-1.5 text-xs font-semibold text-ink-faint uppercase tracking-wider">{cat}</p>
                        {items.map(cmd => {
                          const i = idx++
                          const active = i === selected
                          return (
                            <button key={cmd.id} onClick={() => { cmd.action(); setOpen(false) }}
                              onMouseEnter={() => setSelected(i)}
                              className={cn(
                                "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                                active ? "bg-brand-purple-light" : "hover:bg-surface-muted"
                              )}>
                              <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                                active ? "bg-brand-purple text-white shadow-purple" : "bg-surface-muted text-ink-muted"
                              )}>
                                {cmd.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-ink">{cmd.label}</p>
                                <p className="text-xs text-ink-faint truncate">{cmd.description}</p>
                              </div>
                              {active && <ArrowRight className="w-3.5 h-3.5 text-brand-purple flex-shrink-0" />}
                            </button>
                          )
                        })}
                      </div>
                    )
                  })
              }
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-surface-border flex items-center gap-4 text-xs text-ink-faint bg-surface-muted">
              <span><kbd className="font-mono">↑↓</kbd> Navigate</span>
              <span><kbd className="font-mono">↵</kbd> Open</span>
              <span><kbd className="font-mono">⌘K</kbd> Toggle</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

"use client"
import { Copy, Check } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface BulletRewriterProps {
  original: string[]
  rewritten: string[]
  dark?: boolean
  className?: string
}

export function BulletRewriter({ original, rewritten, dark = false, className }: BulletRewriterProps) {
  const [copied, setCopied] = useState<number | null>(null)

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text)
    setCopied(idx)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className={cn("space-y-4", className)}>
      {original.map((orig, i) => (
        <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Original */}
          <div className="rounded-xl p-4" style={
            dark
              ? { background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.15)" }
              : { background: "#fef2f2", border: "1px solid #fecaca" }
          }>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: dark ? "#F87171" : "#dc2626" }}>Original</span>
            </div>
            <p className="text-sm leading-relaxed"
              style={{ color: dark ? "rgba(255,255,255,0.6)" : "#374151" }}>{orig}</p>
          </div>
          {/* Improved */}
          <div className="rounded-xl p-4" style={
            dark
              ? { background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)" }
              : { background: "#f0fdf4", border: "1px solid #bbf7d0" }
          }>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: dark ? "#34D399" : "#16a34a" }}>AI Improved</span>
              <button
                onClick={() => handleCopy(rewritten[i] || "", i)}
                className="flex items-center gap-1 text-xs transition-opacity hover:opacity-70"
                style={{ color: dark ? "rgba(255,255,255,0.35)" : "#6b7280" }}
              >
                {copied === i
                  ? <><Check className="w-3 h-3" style={{ color: "#34D399" }} /> Copied</>
                  : <><Copy className="w-3 h-3" /> Copy</>
                }
              </button>
            </div>
            <p className="text-sm leading-relaxed"
              style={{ color: dark ? "rgba(255,255,255,0.75)" : "#374151" }}>
              {rewritten[i] || "Improved version generating..."}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

"use client"
import { ArrowRight, Copy, Check } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface BulletRewriterProps {
  original: string[]
  rewritten: string[]
  className?: string
}

export function BulletRewriter({ original, rewritten, className }: BulletRewriterProps) {
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
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">Original</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{orig}</p>
          </div>
          {/* Arrow on mobile */}
          <div className="hidden md:flex items-center justify-center absolute" style={{ left: "50%", transform: "translateX(-50%)" }}>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </div>
          {/* Improved */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">AI Improved</span>
              <button
                onClick={() => handleCopy(rewritten[i] || "", i)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                {copied === i ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                {copied === i ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{rewritten[i] || "Improved version generating..."}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

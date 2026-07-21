"use client"
import { cn } from "@/lib/utils"

interface KeywordTagsProps {
  keywords: string[]
  variant: "matched" | "missing"
  dark?: boolean
  className?: string
}

export function KeywordTags({ keywords, variant, dark = false, className }: KeywordTagsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {keywords.map((keyword) => (
        <span
          key={keyword}
          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
          style={dark
            ? variant === "matched"
              ? { color: "#34D399", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }
              : { color: "#F87171", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)" }
            : variant === "matched"
              ? { color: "#15803d", background: "#f0fdf4", border: "1px solid #bbf7d0" }
              : { color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca" }
          }
        >
          {variant === "matched" ? "✓ " : "✗ "}
          {keyword}
        </span>
      ))}
    </div>
  )
}

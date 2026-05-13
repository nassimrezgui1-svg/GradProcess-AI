"use client"
import { cn } from "@/lib/utils"

interface KeywordTagsProps {
  keywords: string[]
  variant: "matched" | "missing"
  className?: string
}

export function KeywordTags({ keywords, variant, className }: KeywordTagsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {keywords.map((keyword) => (
        <span
          key={keyword}
          className={cn(
            "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium",
            variant === "matched"
              ? "bg-green-100 text-green-700 border border-green-200"
              : "bg-red-100 text-red-700 border border-red-200"
          )}
        >
          {variant === "matched" ? "✓ " : "✗ "}
          {keyword}
        </span>
      ))}
    </div>
  )
}

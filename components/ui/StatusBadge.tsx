import { cn } from "@/lib/utils"
import { ReactNode } from "react"

type BadgeVariant = "blue" | "violet" | "cyan" | "green" | "amber" | "red" | "slate" | "gold"

const variantMap: Record<BadgeVariant, string> = {
  blue:   "bg-[rgba(37,99,235,0.12)] border-[rgba(37,99,235,0.25)] text-blue-400",
  violet: "bg-[rgba(139,92,246,0.12)] border-[rgba(139,92,246,0.25)] text-violet-400",
  cyan:   "bg-[rgba(34,211,238,0.1)] border-[rgba(34,211,238,0.22)] text-cyan-400",
  green:  "bg-[rgba(34,197,94,0.1)] border-[rgba(34,197,94,0.22)] text-emerald-400",
  amber:  "bg-[rgba(251,191,36,0.1)] border-[rgba(251,191,36,0.22)] text-amber-400",
  red:    "bg-[rgba(239,68,68,0.1)] border-[rgba(239,68,68,0.22)] text-red-400",
  slate:  "bg-[rgba(148,163,184,0.08)] border-[rgba(148,163,184,0.18)] text-slate-400",
  gold:   "bg-[rgba(251,191,36,0.12)] border-[rgba(251,191,36,0.28)] text-amber-300",
}

interface StatusBadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  dot?: boolean
  pulse?: boolean
  className?: string
}

export function StatusBadge({
  children,
  variant = "blue",
  dot = false,
  pulse = false,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border text-xs font-semibold px-2.5 py-1 rounded-full",
        variantMap[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full flex-shrink-0",
            pulse ? "animate-pulse" : "",
            variant === "blue" && "bg-blue-400",
            variant === "violet" && "bg-violet-400",
            variant === "cyan" && "bg-cyan-400",
            variant === "green" && "bg-emerald-400",
            variant === "amber" && "bg-amber-400",
            variant === "red" && "bg-red-400",
            variant === "slate" && "bg-slate-400",
            variant === "gold" && "bg-amber-300",
          )}
        />
      )}
      {children}
    </span>
  )
}

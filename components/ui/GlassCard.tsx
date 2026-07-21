import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface GlassCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  glow?: "blue" | "violet" | "cyan" | "green" | "none"
  padding?: "sm" | "md" | "lg" | "none"
}

const glowMap = {
  blue: "hover:border-blue-500/30 hover:shadow-[0_0_0_1px_rgba(37,99,235,0.2),0_0_20px_rgba(37,99,235,0.12)]",
  violet: "hover:border-violet-500/30 hover:shadow-[0_0_0_1px_rgba(139,92,246,0.2),0_0_20px_rgba(139,92,246,0.12)]",
  cyan: "hover:border-cyan-500/30 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.2),0_0_20px_rgba(34,211,238,0.1)]",
  green: "hover:border-green-500/30 hover:shadow-[0_0_0_1px_rgba(34,197,94,0.18),0_0_20px_rgba(34,197,94,0.1)]",
  none: "",
}

const paddingMap = { none: "", sm: "p-4", md: "p-6", lg: "p-8" }

export function GlassCard({
  children,
  className,
  hover = false,
  glow = "none",
  padding = "md",
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "bg-[rgba(15,23,42,0.65)] backdrop-blur-sm border border-[rgba(148,163,184,0.12)] rounded-2xl",
        hover && "transition-all duration-200 hover:bg-[rgba(15,23,42,0.8)] hover:border-[rgba(148,163,184,0.22)]",
        glow !== "none" && glowMap[glow],
        paddingMap[padding],
        className
      )}
    >
      {children}
    </div>
  )
}

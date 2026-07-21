"use client"
import { cn } from "@/lib/utils"
import { ButtonHTMLAttributes, ReactNode } from "react"

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: "primary" | "ghost" | "danger" | "success"
  size?: "sm" | "md" | "lg"
}

const variantMap = {
  primary: "btn-gradient",
  ghost: "btn-ghost",
  danger: "bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.25)] text-red-400 hover:bg-[rgba(239,68,68,0.18)] hover:border-[rgba(239,68,68,0.35)] transition-colors font-semibold",
  success: "bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.25)] text-emerald-400 hover:bg-[rgba(34,197,94,0.18)] hover:border-[rgba(34,197,94,0.35)] transition-colors font-semibold",
}

const sizeMap = {
  sm: "px-4 py-2 text-xs rounded-xl",
  md: "px-6 py-2.5 text-sm rounded-xl",
  lg: "px-8 py-3.5 text-sm rounded-xl",
}

export function GradientButton({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: GradientButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2",
        variantMap[variant],
        sizeMap[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

import { cn } from "@/lib/utils"
import { ReactNode, ElementType } from "react"

interface MetricCardProps {
  label: string
  value: string | number
  sub?: string
  icon?: ElementType
  iconColor?: string
  iconBg?: string
  trend?: "up" | "down" | "flat"
  className?: string
  children?: ReactNode
}

export function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  iconColor = "text-blue-400",
  iconBg = "bg-[rgba(37,99,235,0.12)]",
  trend,
  className,
  children,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "bg-[rgba(15,23,42,0.65)] border border-[rgba(148,163,184,0.12)] rounded-2xl p-5",
        "hover:border-[rgba(148,163,184,0.2)] hover:bg-[rgba(15,23,42,0.8)] transition-all duration-200",
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</p>
        {Icon && (
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", iconBg)}>
            <Icon className={cn("w-4 h-4", iconColor)} />
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-white tabular-nums mb-0.5">{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
      {children}
    </div>
  )
}

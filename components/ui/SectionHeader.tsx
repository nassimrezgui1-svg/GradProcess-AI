import { cn } from "@/lib/utils"
import { ElementType, ReactNode } from "react"

interface SectionHeaderProps {
  title: string
  subtitle?: string
  icon?: ElementType
  iconColor?: string
  action?: ReactNode
  className?: string
}

export function SectionHeader({
  title,
  subtitle,
  icon: Icon,
  iconColor = "text-blue-400",
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4 mb-5", className)}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-[rgba(37,99,235,0.1)] flex items-center justify-center flex-shrink-0">
            <Icon className={cn("w-4 h-4", iconColor)} />
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

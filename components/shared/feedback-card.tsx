"use client"
import { cn } from "@/lib/utils"
import { CheckCircle, AlertCircle, Info, XCircle } from "lucide-react"
import React from "react"

type FeedbackType = "success" | "warning" | "info" | "error"

interface FeedbackCardProps {
  type: FeedbackType
  title: string
  items?: string[]
  description?: string
  className?: string
}

const icons: Record<FeedbackType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-green-500" />,
  warning: <AlertCircle className="w-5 h-5 text-amber-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
  error: <XCircle className="w-5 h-5 text-red-500" />,
}

const styles: Record<FeedbackType, string> = {
  success: "bg-green-50 border-green-200",
  warning: "bg-amber-50 border-amber-200",
  info: "bg-blue-50 border-blue-200",
  error: "bg-red-50 border-red-200",
}

export function FeedbackCard({ type, title, items, description, className }: FeedbackCardProps) {
  return (
    <div className={cn("rounded-xl border p-4", styles[type], className)}>
      <div className="flex items-center gap-2 mb-2">
        {icons[type]}
        <h4 className="font-semibold text-sm text-gray-900">{title}</h4>
      </div>
      {description && <p className="text-sm text-gray-600 mb-2">{description}</p>}
      {items && items.length > 0 && (
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li key={i} className="text-sm text-gray-600 flex items-start gap-1.5">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

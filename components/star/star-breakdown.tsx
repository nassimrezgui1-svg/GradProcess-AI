"use client"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface STARBreakdownProps {
  situation: string
  task: string
  action: string
  result: string
  className?: string
}

const tabs = [
  { key: "situation", label: "S — Situation", color: "bg-blue-500" },
  { key: "task", label: "T — Task", color: "bg-purple-500" },
  { key: "action", label: "A — Action", color: "bg-orange-500" },
  { key: "result", label: "R — Result", color: "bg-green-500" },
] as const

type TabKey = "situation" | "task" | "action" | "result"

export function STARBreakdown({ situation, task, action, result, className }: STARBreakdownProps) {
  const [active, setActive] = useState<TabKey>("situation")

  const content: Record<TabKey, string> = { situation, task, action, result }

  return (
    <div className={cn("bg-white rounded-2xl border border-gray-100 overflow-hidden", className)}>
      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={cn(
              "flex-1 py-3 text-xs font-semibold transition-all border-b-2 -mb-px",
              active === tab.key
                ? "border-blue-600 text-blue-600 bg-blue-50"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <div className={cn("w-2 h-2 rounded-full", tabs.find(t => t.key === active)?.color)} />
          <span className="text-sm font-semibold text-gray-700 capitalize">{active}</span>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{content[active]}</p>
      </div>
    </div>
  )
}

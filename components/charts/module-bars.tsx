"use client"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { ChartFrame } from "./chart-frame"

interface ModuleBarsProps {
  data: { name: string; score: number }[]
  className?: string
  horizontal?: boolean
  dark?: boolean
}

function getBarColor(score: number) {
  if (score >= 75) return "#22c55e"
  if (score >= 40) return "#f59e0b"
  return "#ef4444"
}

export function ModuleBars({ data, className, horizontal = false, dark = false }: ModuleBarsProps) {
  const gridColor = dark ? "rgba(255,255,255,0.05)" : "#f1f5f9"
  const tickColor = dark ? "rgba(255,255,255,0.3)" : "#94a3b8"
  const labelColor = dark ? "rgba(255,255,255,0.45)" : "#64748b"
  const tooltipStyle = dark
    ? { backgroundColor: "rgba(8,14,30,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", fontSize: 12, color: "#fff" }
    : { backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: 12 }

  if (horizontal) {
    return (
      <ChartFrame className={className} height={Math.max(200, data.length * 45)}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 80, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: labelColor }} axisLine={false} tickLine={false} width={75} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value: unknown) => [`${value}/100`, "Score"]} />
            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>
    )
  }

  return (
    <ChartFrame className={className} height={220}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value: unknown) => [`${value}/100`, "Score"]} />
          <Bar dataKey="score" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
}

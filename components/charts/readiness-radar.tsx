"use client"
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip,
} from "recharts"

interface ReadinessRadarProps {
  data: { module: string; score: number; fullMark: number }[]
  className?: string
  dark?: boolean
}

export function ReadinessRadar({ data, className, dark }: ReadinessRadarProps) {
  return (
    <div className={className} style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke={dark ? "rgba(255,255,255,0.08)" : "#e2e8f0"} />
          <PolarAngleAxis
            dataKey="module"
            tick={{ fontSize: 11, fill: dark ? "#6b7280" : "#64748b" }}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={dark ? 0.15 : 0.2}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: dark ? "#0d1424" : "#fff",
              border: `1px solid ${dark ? "rgba(255,255,255,0.1)" : "#e2e8f0"}`,
              borderRadius: "8px",
              fontSize: 12,
              color: dark ? "#e5e7eb" : undefined,
            }}
            formatter={(value: unknown) => [`${value}/100`, "Score"]}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

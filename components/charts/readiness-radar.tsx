"use client"
import { memo } from "react"
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip,
} from "recharts"
import { ChartFrame } from "./chart-frame"

interface ReadinessRadarProps {
  data: { module: string; score: number; fullMark: number }[]
  className?: string
  dark?: boolean
}

function ReadinessRadarImpl({ data, className, dark }: ReadinessRadarProps) {
  // With every module at zero the radius domain collapses and the chart draws
  // its axes with no shape at all, which reads as a broken chart rather than
  // an empty one.
  const hasAnyScore = data.some(d => (d?.score ?? 0) > 0)
  if (!hasAnyScore) {
    return (
      <div className={className}
        style={{ width: "100%", height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p className="text-sm text-center" style={{ color: dark ? "rgba(255,255,255,0.52)" : "#64748b" }}>
          Complete a module to build your skill coverage
        </p>
      </div>
    )
  }

  return (
    <ChartFrame className={className} height={260}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke={dark ? "rgba(255,255,255,0.08)" : "#e2e8f0"} />
          <PolarAngleAxis
            dataKey="module"
            tick={{ fontSize: 11, fill: dark ? "#6b7280" : "#64748b" }}
          />
          {/* Without a fixed domain Recharts scales the radius to the data, so a
              single score of 62 was drawn touching the outer edge — indistinguishable
              from a perfect score. Scores are out of 100, so the axis is too. */}
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          {/* A radar polygon with one non-zero vertex has no area — it renders as
              a flat line and reads as an empty chart, which is what a user sees
              until they have completed three modules. The dots keep each
              completed module visible on its own. */}
          <Radar
            name="Score"
            dataKey="score"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={dark ? 0.15 : 0.2}
            strokeWidth={2}
            dot={{ r: 4, fill: "#3b82f6", stroke: "#3b82f6" }}
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
    </ChartFrame>
  )
}

/**
 * Memoised because a parent re-render must not re-render the chart.
 * Recharts 3 keeps an internal Redux store, and a 12 September crash report
 * showed an unbounded update loop running through it — dispatch ->
 * notifyNestedSubs -> render -> dispatch — raising "Maximum update depth
 * exceeded" (React #185) and killing the browser tab while typing on a page
 * that renders a chart. With referentially stable props the chart subtree now
 * stays out of those renders entirely.
 */
export const ReadinessRadar = memo(ReadinessRadarImpl)

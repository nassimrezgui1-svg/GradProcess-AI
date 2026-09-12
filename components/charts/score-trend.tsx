"use client"
import { memo } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { ChartFrame } from "./chart-frame"

interface ScoreTrendProps {
  data: { date: string; score: number }[]
  className?: string
}

function ScoreTrendImpl({ data, className }: ScoreTrendProps) {
  return (
    <ChartFrame className={className} height={200}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              fontSize: 12,
            }}
            formatter={(value: unknown) => [`${value}/100`, "Readiness Score"]}
          />
          <ReferenceLine y={75} stroke="#22c55e" strokeDasharray="4 4" strokeOpacity={0.5} />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#2563eb"
            strokeWidth={2.5}
            dot={{ fill: "#2563eb", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
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
export const ScoreTrend = memo(ScoreTrendImpl)

"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

/**
 * Holds a chart's box and only renders it once that box has a real size.
 *
 * Recharts' ResponsiveContainer measures its parent on mount. Several of these
 * charts mount inside a framer-motion entrance animation or a grid cell that
 * has not been laid out yet, so the first measurement is zero and Recharts
 * logs "The width(-1) and height(-1) of chart should be greater than 0".
 *
 * Reserving the height here keeps the layout from shifting when the chart
 * appears, so the deferral is invisible.
 */
export function ChartFrame({
  height,
  className,
  children,
}: {
  height: number
  className?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (el.getBoundingClientRect().width > 0) {
      setReady(true)
      return
    }
    const observer = new ResizeObserver(entries => {
      if (entries.some(e => e.contentRect.width > 0)) {
        setReady(true)
        observer.disconnect()
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    // minWidth:0 lets the box shrink inside flex and grid parents, which
    // otherwise floor it at their content width and overflow the card.
    <div ref={ref} className={className} style={{ width: "100%", height, minWidth: 0 }}>
      {ready ? children : null}
    </div>
  )
}

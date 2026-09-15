"use client"

/**
 * Renders an abstract-reasoning figure from a small structured description.
 *
 * Abstract and diagrammatic reasoning is a visual test — employers show shape
 * sequences and ask what comes next. This one asked the model to "describe the
 * pattern in words since this is text-based", which turns a visual test into a
 * reading-comprehension one and is not what a candidate is actually assessed
 * on.
 *
 * The model now returns shapes as data and they are drawn here, so the figures
 * are real, deterministic, and readable in the app's own palette.
 */

export interface Shape {
  kind: "circle" | "square" | "triangle" | "diamond" | "cross" | "arrow"
  /** 1-4, drawn as that many copies inside the cell. */
  count?: number
  filled?: boolean
  /** Degrees clockwise. */
  rotation?: number
  /** Index into the palette, so figures stay inside the app's colours. */
  colour?: number
}

const PALETTE = ["#8FB4FF", "#6EE7B7", "#FCD34D", "#C4B5FD", "#FCA5A5"]

function draw(shape: Shape, key: number, cx: number, cy: number, r: number) {
  const stroke = PALETTE[(shape.colour ?? 0) % PALETTE.length]
  const fill = shape.filled ? stroke : "none"
  const common = {
    stroke,
    fill,
    strokeWidth: 2.5,
    strokeLinejoin: "round" as const,
    strokeLinecap: "round" as const,
    transform: shape.rotation ? `rotate(${shape.rotation} ${cx} ${cy})` : undefined,
  }

  switch (shape.kind) {
    case "circle":
      return <circle key={key} cx={cx} cy={cy} r={r} {...common} />
    case "square":
      return <rect key={key} x={cx - r} y={cy - r} width={r * 2} height={r * 2} rx={2} {...common} />
    case "triangle":
      return <polygon key={key} points={`${cx},${cy - r} ${cx + r},${cy + r} ${cx - r},${cy + r}`} {...common} />
    case "diamond":
      return <polygon key={key} points={`${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`} {...common} />
    case "cross":
      return (
        <g key={key} {...common} fill="none">
          <line x1={cx - r} y1={cy - r} x2={cx + r} y2={cy + r} stroke={stroke} strokeWidth={2.5} strokeLinecap="round" />
          <line x1={cx + r} y1={cy - r} x2={cx - r} y2={cy + r} stroke={stroke} strokeWidth={2.5} strokeLinecap="round" />
        </g>
      )
    case "arrow":
      return (
        <g key={key} transform={shape.rotation ? `rotate(${shape.rotation} ${cx} ${cy})` : undefined}>
          <line x1={cx} y1={cy + r} x2={cx} y2={cy - r} stroke={stroke} strokeWidth={2.5} strokeLinecap="round" />
          <polyline
            points={`${cx - r * 0.5},${cy - r * 0.35} ${cx},${cy - r} ${cx + r * 0.5},${cy - r * 0.35}`}
            stroke={stroke} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round"
          />
        </g>
      )
    default:
      return null
  }
}

/** One cell of a sequence, or one answer option. */
export function ShapeFigure({ shapes, size = 72 }: { shapes: Shape[]; size?: number }) {
  const box = 100
  const items = shapes.flatMap(s => Array.from({ length: Math.min(s.count ?? 1, 4) }, () => s))

  // Lay 1-4 copies out so they never overlap or leave the viewBox.
  const layouts: Record<number, [number, number][]> = {
    1: [[50, 50]],
    2: [[32, 50], [68, 50]],
    3: [[50, 30], [32, 68], [68, 68]],
    4: [[32, 32], [68, 32], [32, 68], [68, 68]],
  }
  const n = Math.min(Math.max(items.length, 1), 4)
  const positions = layouts[n]
  const r = n === 1 ? 26 : n === 2 ? 18 : 15

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${box} ${box}`}
      role="img"
      aria-label={shapes.map(s => `${s.count ?? 1} ${s.filled ? "filled" : "outlined"} ${s.kind}`).join(", ")}
    >
      <rect x="1" y="1" width={box - 2} height={box - 2} rx="8"
        fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.10)" strokeWidth="1.5" />
      {items.slice(0, n).map((s, i) => draw(s, i, positions[i][0], positions[i][1], r))}
    </svg>
  )
}

/** The question stem: a row of figures ending in the cell to work out. */
export function ShapeSequence({ cells, size = 72 }: { cells: Shape[][]; size?: number }) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {cells.map((shapes, i) => (
        <ShapeFigure key={i} shapes={shapes} size={size} />
      ))}
      <div
        className="flex items-center justify-center rounded-lg"
        style={{
          width: size, height: size,
          border: "2px dashed rgba(143,180,255,0.5)",
          background: "rgba(143,180,255,0.06)",
        }}
        aria-label="the missing figure"
      >
        <span className="text-2xl font-bold" style={{ color: "#8FB4FF" }}>?</span>
      </div>
    </div>
  )
}

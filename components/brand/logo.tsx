// GradProcess AI brand logo — SVG recreation matching the provided logo asset.
// The mark is a "G" in purple→teal gradient with a graduation cap, ascending bars, and an arrow.

import { cn } from "@/lib/utils"

interface LogoMarkProps {
  size?: number
  className?: string
}

/** The icon-only mark (G + cap + bars + arrow) */
export function LogoMark({ size = 40, className }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Purple → blue → teal gradient matching the logo */}
        <linearGradient id="gp-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#7C3AED" />
          <stop offset="45%"  stopColor="#6D5EF3" />
          <stop offset="75%"  stopColor="#5B8DEF" />
          <stop offset="100%" stopColor="#53D6C7" />
        </linearGradient>
        {/* Lighter fill for the bars */}
        <linearGradient id="bar-grad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%"   stopColor="#C4B5FD" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#A5B4FC" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* ── G arc body ── */}
      {/* Outer arc path approximating a "G" shape */}
      <path
        d="
          M 50 8
          C 75 8, 92 25, 92 50
          C 92 75, 75 92, 50 92
          C 25 92, 8 75, 8 50
          C 8 30, 20 14, 36 9
        "
        stroke="url(#gp-grad)"
        strokeWidth="13"
        strokeLinecap="round"
        fill="none"
      />

      {/* G crossbar + right extension with upward-right arrow */}
      <path
        d="M 50 50 L 88 50"
        stroke="url(#gp-grad)"
        strokeWidth="13"
        strokeLinecap="round"
        fill="none"
      />
      {/* Arrow tip */}
      <path
        d="M 78 40 L 90 50 L 78 60"
        stroke="url(#gp-grad)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* ── Bar chart (3 ascending bars inside the G) ── */}
      <rect x="36" y="58" width="7" height="16" rx="2" fill="url(#bar-grad)" />
      <rect x="46" y="50" width="7" height="24" rx="2" fill="url(#bar-grad)" />
      <rect x="56" y="42" width="7" height="32" rx="2" fill="url(#bar-grad)" />

      {/* ── Graduation cap ── */}
      {/* Cap board */}
      <polygon
        points="22,22 48,11 48,22"
        fill="url(#gp-grad)"
      />
      {/* Cap flat top */}
      <rect x="14" y="19" width="28" height="5" rx="1.5" fill="url(#gp-grad)" />
      {/* Tassel string */}
      <line x1="14" y1="22" x2="14" y2="33" stroke="url(#gp-grad)" strokeWidth="2.5" strokeLinecap="round" />
      {/* Tassel ball */}
      <circle cx="14" cy="35" r="2.5" fill="#7C3AED" />
    </svg>
  )
}

interface LogoFullProps {
  /** Size of the icon mark in px */
  iconSize?: number
  /** Show the "PREPARE. PRACTICE. PROGRESS." tagline */
  showTagline?: boolean
  className?: string
  dark?: boolean
}

/** Full logo: mark + wordmark */
export function LogoFull({ iconSize = 40, showTagline = false, className, dark = false }: LogoFullProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoMark size={iconSize} />
      <div className="flex flex-col leading-none">
        <div className="flex items-baseline gap-1">
          <span className={cn("font-bold", dark ? "text-white" : "text-ink", iconSize >= 36 ? "text-lg" : "text-sm")}>
            GradProcess
          </span>
          <span className={cn("font-bold", iconSize >= 36 ? "text-lg" : "text-sm")}
            style={{ background: "linear-gradient(135deg,#6D5EF3,#53D6C7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            AI
          </span>
        </div>
        {showTagline && (
          <span className={cn("text-xs tracking-widest uppercase mt-0.5", dark ? "text-white/50" : "text-ink-faint")}>
            Prepare · Practice · Progress
          </span>
        )}
      </div>
    </div>
  )
}

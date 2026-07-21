import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Brand ──────────────────────────────────────────────────────────
        brand: {
          purple: "#8B5CF6",
          blue: "#2563EB",
          teal: "#22D3EE",
          "purple-light": "rgba(139,92,246,0.14)",
          "blue-light": "rgba(37,99,235,0.12)",
          "teal-light": "rgba(34,211,238,0.1)",
        },
        // ── Surface (dark midnight palette) ───────────────────────────────
        surface: {
          DEFAULT: "#07111F",
          card: "#0F172A",
          muted: "#0B1B33",
          border: "rgba(148,163,184,0.12)",
        },
        // ── Ink (light text for dark backgrounds) ─────────────────────────
        ink: {
          DEFAULT: "#F8FAFC",
          muted: "#94A3B8",
          faint: "#475569",
        },
        // ── Score semantic colours ─────────────────────────────────────────
        score: {
          great: "#4ADE80",
          "great-bg": "rgba(74,222,128,0.12)",
          good: "#3B82F6",
          "good-bg": "rgba(59,130,246,0.12)",
          warn: "#FBBF24",
          "warn-bg": "rgba(251,191,36,0.12)",
          low: "#FB7185",
          "low-bg": "rgba(251,113,133,0.12)",
        },
        // ── Named dark palette ─────────────────────────────────────────────
        midnight: "#07111F",
        "ink-navy": "#0B1B33",
        "card-navy": "#0F172A",
        electric: "#2563EB",
        cyan: "#22D3EE",
        violet: "#8B5CF6",
        // legacy aliases kept for compatibility
        navy: "#07111F",
        "navy-800": "#0F172A",
        "navy-700": "#0B1B33",
        "score-red": "#FB7185",
        "score-amber": "#FBBF24",
        "score-green": "#4ADE80",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 4px 0 rgba(0,0,0,0.35), 0 1px 2px -1px rgba(0,0,0,0.4)",
        "card-hover": "0 4px 24px 0 rgba(0,0,0,0.45), 0 1px 2px 0 rgba(0,0,0,0.3)",
        purple: "0 4px 24px 0 rgba(139,92,246,0.25)",
        blue: "0 4px 24px 0 rgba(37,99,235,0.28)",
        cyan: "0 4px 24px 0 rgba(34,211,238,0.2)",
        soft: "0 2px 12px 0 rgba(0,0,0,0.3)",
        glow: "0 0 0 1px rgba(37,99,235,0.2), 0 0 20px rgba(37,99,235,0.15)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        "pulse-glow": {
          "0%,100%": { boxShadow: "0 0 8px rgba(37,99,235,0.3)" },
          "50%": { boxShadow: "0 0 22px rgba(37,99,235,0.55)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out",
        "scale-in": "scale-in 0.25s ease-out",
        shimmer: "shimmer 1.4s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2.5s ease-in-out infinite",
      },
    },
  },
}
export default config

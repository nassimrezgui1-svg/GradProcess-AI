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
        brand: {
          purple: "#6D5EF3",
          blue: "#5B8DEF",
          teal: "#53D6C7",
          "purple-light": "#EEE9FF",
          "blue-light": "#EBF1FD",
          "teal-light": "#E4FAF7",
        },
        surface: {
          DEFAULT: "#FAFAFC",
          card: "#FFFFFF",
          muted: "#F3F5F9",
          border: "#E8EAF0",
        },
        ink: {
          DEFAULT: "#1E1E2F",
          muted: "#6B7280",
          faint: "#9CA3AF",
        },
        score: {
          great: "#4ADE80",
          "great-bg": "#F0FDF4",
          good: "#5B8DEF",
          "good-bg": "#EBF1FD",
          warn: "#FBBF24",
          "warn-bg": "#FFFBEB",
          low: "#FB7185",
          "low-bg": "#FFF1F2",
        },
        navy: "#0a0f1e",
        "navy-800": "#0f172a",
        "navy-700": "#1e293b",
        electric: "#6D5EF3",
        teal: "#53D6C7",
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
        card: "0 1px 3px 0 rgba(0,0,0,0.04), 0 1px 2px -1px rgba(0,0,0,0.04)",
        "card-hover": "0 4px 16px 0 rgba(0,0,0,0.08), 0 1px 2px 0 rgba(0,0,0,0.04)",
        purple: "0 4px 24px 0 rgba(109,94,243,0.18)",
        soft: "0 2px 12px 0 rgba(0,0,0,0.06)",
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
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out",
        "scale-in": "scale-in 0.25s ease-out",
        shimmer: "shimmer 1.4s ease-in-out infinite",
      },
    },
  },
}
export default config

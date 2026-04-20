import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        display: ["var(--font-display)", "serif"],
      },
      colors: {
        ink: {
          DEFAULT: "#0a0a0a",
          50: "#f5f5f5",
          100: "#e5e5e5",
          200: "#c4c4c4",
          300: "#8a8a8a",
          400: "#525252",
          500: "#2e2e2e",
          600: "#1f1f1f",
          700: "#161616",
          800: "#0f0f0f",
          900: "#0a0a0a",
        },
        amber: {
          DEFAULT: "#f5a524",
          bright: "#ffb800",
          muted: "#b37d1b",
          dim: "#5c4010",
        },
        emerald: { DEFAULT: "#10b981", muted: "#065f46" },
        crimson: { DEFAULT: "#ef4444", muted: "#7f1d1d" },
        azure: { DEFAULT: "#3b82f6", muted: "#1e3a8a" },
      },
      animation: {
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        blink: "blink 1s step-end infinite",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        blink: { "0%,100%": { opacity: "1" }, "50%": { opacity: "0" } },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;

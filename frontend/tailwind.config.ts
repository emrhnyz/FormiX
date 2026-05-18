import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#05060a",
          900: "#0a0c12",
          800: "#12151f",
          700: "#1a1f2e",
        },
        accent: {
          cyan: "#22d3ee",
          violet: "#8b5cf6",
          fuchsia: "#d946ef",
        },
      },
      fontFamily: {
        display: ["var(--font-outfit)", "system-ui", "sans-serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-up": "fade-up 0.7s ease-out forwards",
        "fade-in": "fade-in 0.6s ease-out forwards",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 8s linear infinite",
        "pulse-glow": "pulse-glow 5s ease-in-out infinite",
        "orbit-slow": "orbit 22s linear infinite",
        "orbit-reverse": "orbit-reverse 28s linear infinite",
        drift: "drift 14s ease-in-out infinite",
        "drift-reverse": "drift-reverse 16s ease-in-out infinite",
        "scan-line": "scan-line 8s ease-in-out infinite",
        "grid-drift": "grid-drift 40s linear infinite",
        "border-glow": "border-glow 3s ease-in-out infinite",
        "btn-shine": "btn-shine 2.5s ease-in-out infinite",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.35", transform: "scale(1)" },
          "50%": { opacity: "0.65", transform: "scale(1.05)" },
        },
        orbit: {
          "0%": { transform: "translate(0, 0) rotate(0deg)" },
          "33%": { transform: "translate(30px, -20px) rotate(120deg)" },
          "66%": { transform: "translate(-20px, 25px) rotate(240deg)" },
          "100%": { transform: "translate(0, 0) rotate(360deg)" },
        },
        "orbit-reverse": {
          "0%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(-40px, -30px)" },
          "100%": { transform: "translate(0, 0)" },
        },
        drift: {
          "0%, 100%": { transform: "translate(0, 0) rotate(0deg)", opacity: "0.15" },
          "50%": { transform: "translate(12px, -18px) rotate(8deg)", opacity: "0.28" },
        },
        "drift-reverse": {
          "0%, 100%": { transform: "translate(0, 0)", opacity: "0.12" },
          "50%": { transform: "translate(-16px, 12px)", opacity: "0.22" },
        },
        "scan-line": {
          "0%, 100%": { transform: "translateY(-30%)", opacity: "0.3" },
          "50%": { transform: "translateY(30%)", opacity: "0.6" },
        },
        "grid-drift": {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "64px 64px" },
        },
        "border-glow": {
          "0%, 100%": { borderColor: "rgba(139, 92, 246, 0.15)" },
          "50%": { borderColor: "rgba(34, 211, 238, 0.35)" },
        },
        "btn-shine": {
          "0%": { transform: "translateX(-120%) skewX(-12deg)" },
          "100%": { transform: "translateX(220%) skewX(-12deg)" },
        },
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to right, rgba(139,92,246,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(139,92,246,0.07) 1px, transparent 1px)",
        "hero-glow":
          "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(139,92,246,0.35), transparent), radial-gradient(ellipse 50% 40% at 80% 50%, rgba(34,211,238,0.12), transparent)",
        "hex-grid":
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100' viewBox='0 0 56 100'%3E%3Cpath d='M28 0 L56 16 v32 L28 64 L0 48 V16 Z' fill='none' stroke='%238b5cf6' stroke-width='0.5'/%3E%3C/svg%3E\")",
      },
      backgroundSize: {
        grid: "48px 48px",
        "hex-grid": "56px 100px",
      },
    },
  },
  plugins: [],
};

export default config;

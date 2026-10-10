import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        radar: {
          bg: "#050811",
          surface: "#0B1220",
          elevated: "#121C2F",
          card: "#0E1726",
          border: "#1E2D44",
          borderLight: "#2A3F61",
          teal: "#4DE0C1",
          tealDark: "#1A5D52",
          tealGlow: "rgba(77, 224, 193, 0.15)",
          cyan: "#00F0FF",
          blue: "#38BDF8",
          purple: "#A855F7",
          magenta: "#FF2E93",
          amber: "#F59E0B",
          rose: "#F43F5E",
          emerald: "#10B981",
          indigo: "#818CF8",
          muted: "#94A3B8",
          subtle: "#64748B",
        },
      },
      fontFamily: {
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          '"Liberation Mono"',
          '"Courier New"',
          "monospace",
        ],
      },
      boxShadow: {
        "noc-glow": "0 0 15px -3px rgba(77, 224, 193, 0.25)",
        "noc-glow-cyan": "0 0 20px -2px rgba(0, 240, 255, 0.35)",
        "noc-glow-magenta": "0 0 20px -2px rgba(255, 46, 147, 0.35)",
        "noc-glow-purple": "0 0 20px -2px rgba(168, 85, 247, 0.35)",
        "noc-card": "0 4px 20px -2px rgba(0, 0, 0, 0.7)",
      },
      keyframes: {
        pulseTeal: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
        pulseNeon: {
          "0%, 100%": { opacity: "1", filter: "drop-shadow(0 0 8px currentColor)" },
          "50%": { opacity: "0.4", filter: "drop-shadow(0 0 2px currentColor)" },
        },
        radarSweep: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        particleFlow: {
          "0%": { strokeDashoffset: "200" },
          "100%": { strokeDashoffset: "0" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
      animation: {
        "pulse-teal": "pulseTeal 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-neon": "pulseNeon 2s ease-in-out infinite",
        "radar-sweep": "radarSweep 4s linear infinite",
        "particle-flow": "particleFlow 3s linear infinite",
        "scanline": "scanline 8s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;

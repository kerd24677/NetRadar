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
          bg: "#0B1220",
          surface: "#141F31",
          elevated: "#1B2A42",
          border: "#243654",
          borderLight: "#2E446B",
          teal: "#4DE0C1",
          tealDark: "#1A5D52",
          tealGlow: "rgba(77, 224, 193, 0.15)",
          cyan: "#38BDF8",
          amber: "#F59E0B",
          rose: "#F43F5E",
          emerald: "#10B981",
          indigo: "#818CF8",
          muted: "#94A3B8",
          subtle: "#64748B",
          card: "#111B2C",
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
        "noc-glow": "0 0 15px -3px rgba(77, 224, 193, 0.15)",
        "noc-card": "0 4px 20px -2px rgba(0, 0, 0, 0.5)",
      },
      keyframes: {
        pulseTeal: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        radarSweep: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "pulse-teal": "pulseTeal 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "radar-sweep": "radarSweep 4s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;

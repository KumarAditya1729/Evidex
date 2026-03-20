import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#07101a",
        panel: "#0f1e2e",
        accent: "#00b7a5",
        signal: "#ff9b42",
        cloud: "#b8d9f5"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(0, 183, 165, 0.35), 0 18px 60px rgba(0, 183, 165, 0.15)"
      }
    }
  },
  plugins: []
};

export default config;

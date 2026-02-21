import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#2c3e50",
        "navy-light": "#34495e",
        orange: "#e8a317",
        "orange-light": "#f0b830",
        teal: "#2ecc71",
        "teal-dark": "#27ae60",
        editor: {
          bg: "#1e1e2e",
          line: "#282840",
          text: "#cdd6f4",
          comment: "#6c7086",
          keyword: "#cba6f7",
          string: "#a6e3a1",
          number: "#fab387",
        },
      },
      fontFamily: {
        mono: ["Fira Code", "Fira Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;

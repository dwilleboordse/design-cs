import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "hsl(220 14% 9%)",
        panel: "hsl(220 14% 12%)",
        panel2: "hsl(220 14% 15%)",
        border: "hsl(220 10% 22%)",
        text: "hsl(220 10% 92%)",
        muted: "hsl(220 8% 60%)",
        accent: "hsl(217 91% 60%)",
        success: "hsl(142 71% 45%)",
        warning: "hsl(38 92% 50%)",
        danger: "hsl(0 72% 51%)",
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;

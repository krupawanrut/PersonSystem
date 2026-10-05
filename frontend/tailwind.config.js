/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./components/**/*.{vue,js}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./app.vue",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Sarabun", "Noto Sans Thai", "sans-serif"],
      },
      colors: {
        ink: "#1b2430",
        "ink-soft": "#6b7280",
        "brand-bg": "#f5f3ee",
        "panel-a": "#13203b",
        "panel-b": "#1f4e8c",
        "accent-warm": "#b5792a",
      },
    },
  },
  daisyui: {
    themes: [
      {
        personsystem: {
          primary: "#1f4e8c",
          secondary: "#b5792a",
          accent: "#2f6bb0",
          neutral: "#1b2430",
          "base-100": "#ffffff",
          "base-200": "#f5f3ee",
          info: "#2f6bb0",
          success: "#2f7d4f",
          warning: "#c17f1f",
          error: "#b23b3b",
        },
      },
    ],
  },
  plugins: [require("daisyui")],
};

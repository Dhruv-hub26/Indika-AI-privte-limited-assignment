/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
      },
      colors: {
        ink: { 950: "#0b1220", 900: "#111827", 800: "#1f2937" },
        accent: { DEFAULT: "#6366f1", dim: "#4f46e5" },
      },
    },
  },
  plugins: [],
};

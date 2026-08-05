/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F5F7FA",
        card: "#FFFFFF",
        primary: "#2563EB",
        success: "#16A34A",
        danger: "#DC2626",
        warning: "#D97706",
        border: "#E5E7EB",
        secondary: "#6B7280", // text-secondary
        textmain: "#111827", // text-primary
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
      }
    },
  },
  plugins: [],
}

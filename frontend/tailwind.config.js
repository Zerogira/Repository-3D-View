/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#0b0f19",
          card: "#111827",
          cyan: "#22d3ee",
          pink: "#ec4899",
          purple: "#a855f7",
          border: "#1e293b",
        }
      },
      boxShadow: {
        'neon-cyan': '0 0 20px rgba(34, 211, 238, 0.4)',
        'neon-pink': '0 0 20px rgba(236, 72, 153, 0.4)',
        'neon-cyan-sm': '0 0 8px rgba(34, 211, 238, 0.3)',
        'neon-pink-sm': '0 0 8px rgba(236, 72, 153, 0.3)',
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

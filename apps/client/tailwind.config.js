/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'game-bg': '#0f0f0f',
        'panel-bg': '#1a1a1a',
        'panel-border': '#2a2a2a',
        'text-primary': '#e0e0e0',
        'text-secondary': '#a0a0a0',
        'accent': '#6366f1',
        'accent-hover': '#4f46e5',
      },
    },
  },
  plugins: [],
}

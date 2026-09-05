/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        chalkboard: {
          dark: '#0f172a',
          board: '#1e293b',
          border: '#334155',
          text: '#f8fafc',
          accent: '#38bdf8',
        },
      },
    },
  },
  plugins: [],
}

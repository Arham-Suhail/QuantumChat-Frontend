/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          cyan: '#00d4ff',
          bg: '#0a0e14',
          surface: '#161b22',
          text: '#e6edf3',
          textMuted: '#8b949e',
        }
      }
    },
  },
  plugins: [],
}

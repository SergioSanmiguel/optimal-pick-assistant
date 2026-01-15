/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lol: {
          gold: '#C8AA6E',
          blue: '#0AC8B9',
          dark: '#010A13',
          darker: '#0A1428',
          panel: '#1E2328',
          border: '#463714'
        }
      },
      fontFamily: {
        'lol': ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
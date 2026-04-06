/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#F5F5DC',
        bark: '#8B4513',
        clay: '#D2691E',
      },
    },
  },
  plugins: [],
}
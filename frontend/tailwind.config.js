/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f172a',
        card: '#0b1020',
        border: '#1f2a44',
      }
    },
  },
  plugins: [],
}

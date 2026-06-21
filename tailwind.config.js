/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          750: '#2a2f3a',
          850: '#1a1f2b',
          950: '#030712',
        },
      },
    },
  },
  plugins: [],
}

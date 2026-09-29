/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        civic: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#b9ddfe',
          300: '#7cc2fd',
          400: '#36a3fa',
          500: '#0c86eb',
          600: '#026ac8',
          700: '#0354a1',
          800: '#074884',
          900: '#0b3c6f',
          950: '#07264a',
        },
        navy: {
          800: '#0e1f38',
          900: '#0a1628',
          950: '#050c18',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

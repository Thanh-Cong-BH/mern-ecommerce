/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E50914',
          dark: '#B20710',
          light: '#F40612',
        },
        dark: {
          DEFAULT: '#141414',
          light: '#2F2F2F',
          lighter: '#454545',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        yellow: { 400: '#FFE500' },
        coral: { 500: '#FF4D4D' },
        surface: '#1A1A1A',
        bg: '#0F0F0F',
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        lobster: ['Lobster', 'cursive'],
        mono: ['"Space Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}

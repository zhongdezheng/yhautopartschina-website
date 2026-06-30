/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        steel: {
          50: '#f6f7f8',
          100: '#eaecef',
          200: '#d5d9de',
          300: '#b2b9c3',
          400: '#8994a2',
          500: '#6b7787',
          600: '#565f6e',
          700: '#464d5a',
          800: '#3d424d',
          900: '#363a42',
          950: '#1f2126',
        },
        crest: {
          gold: '#C8A96E',
          silver: '#B8BCC0',
          dark: '#1A1C20',
          accent: '#D4442A',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};

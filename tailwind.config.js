/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0A0A0A',
        surface: '#141414',
        line: '#262626',
        concrete: '#8A8A8A',
        text: '#F2F2F2',
        accent: '#6B7F5E',
        danger: '#E06C5A',
      },
      borderRadius: {
        DEFAULT: '6px',
      },
      fontFamily: {
        sans: ['"Montserrat Variable"', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        heading: '0.12em',
        wordmark: '0.32em',
      },
      spacing: {
        header: '72px',
      },
    },
  },
  plugins: [],
};

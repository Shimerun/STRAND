/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0A0A0A',
        surface: '#141414',
        line: '#262626',
        edge: '#666666', // form control borders: >= 3:1 against bg and surface (WCAG 1.4.11)
        concrete: '#8A8A8A',
        text: '#F2F2F2',
        // light: small accent text on bg and surface (8.7:1 on surface; the base green is 4.2:1 there)
        accent: { DEFAULT: '#6B7F5E', light: '#A4B89A' },
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
};

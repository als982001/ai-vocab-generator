/** @type {import('tailwindcss').Config} */
export default {
  content: ['./app/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#000000',
        'primary-inverse': '#ffffff',
        'background-light': '#f3f3f3',
        'background-dark': '#ffffff',
        'surface-dark': '#f9f9f9',
        'surface-highlight': '#e5e5e5',
        'border-color': '#e0e0e0',
        'text-primary': '#171717',
        'text-secondary': '#6b7280',
      },
      fontFamily: {
        display: ['Manrope', 'sans-serif'],
        japanese: ['Noto Sans JP', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '1rem',
        lg: '2rem',
        xl: '3rem',
        full: '9999px',
      },
      keyframes: {
        'highlight-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(0, 0, 0, 0)' },
          '50%': { boxShadow: '0 0 0 4px rgba(0, 0, 0, 0.15)' },
        },
      },
      animation: {
        'highlight-pulse': 'highlight-pulse 0.75s ease-in-out 2',
      },
    },
  },
  plugins: [],
};

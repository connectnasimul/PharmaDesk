/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: v('canvas'),
        card: v('card'),
        ink: v('ink'),
        muted: v('muted'),
        line: v('line'),
        soft: v('soft'),
        brand: {
          100: '#DCEFE9',
          600: '#1F7A64',
          700: '#14604F',
          800: '#0B4A41',
          900: '#06342F',
        },
        lime: { DEFAULT: '#E2F97E', 600: '#CFEA5C' },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Hind Siliguri"', 'system-ui', 'sans-serif'],
        bn: ['"Hind Siliguri"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: { '4xl': '2rem' },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.04)',
        pop: '0 12px 40px rgba(6,52,47,.18)',
      },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
    },
  },
  plugins: [],
};

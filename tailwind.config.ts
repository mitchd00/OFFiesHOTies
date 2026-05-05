import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          black: '#0B0B0B',
          charcoal: '#1A1A1A',
        },
        bg: {
          light: '#F7F7F7',
        },
        gold: '#C6A86B',
        sand: '#E8E1D5',
        text: {
          dark: '#111111',
          light: '#6B6B6B',
        },
        divider: '#E5E5E5',
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '10px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
} satisfies Config;

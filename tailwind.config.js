/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#F8FAFC',
          light: '#F8FAFC',
          dark: '#090D16',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          1: '#FFFFFF',
          2: '#F8FAFC',
          3: '#F1F5F9',
          4: '#E2E8F0',
          dark1: '#111827',
          dark2: '#0F172A',
          dark3: '#1E293B',
          border: '#E2E8F0',
          borderDark: '#1E293B',
        },
        solar: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
          DEFAULT: '#D97706',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Outfit', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        'card-dark': '0 4px 14px 0 rgba(0, 0, 0, 0.45)',
        'elevated': '0 10px 15px -3px rgba(0, 0, 0, 0.06), 0 4px 6px -4px rgba(0, 0, 0, 0.06)',
        'glow-solar': '0 0 20px -3px rgba(217, 119, 6, 0.25)',
      },
    },
  },
  plugins: [],
};

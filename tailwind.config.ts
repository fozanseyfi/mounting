import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        // Renkler CSS değişkeninden: .ui-classic (Fizibilite klasik görünüm) bunları laciverte çevirir
        primary: {
          DEFAULT: 'rgb(var(--p-base) / <alpha-value>)',
          dark: 'rgb(var(--p-dark) / <alpha-value>)',
          soft: 'rgb(var(--p-soft) / <alpha-value>)',
          'soft-foreground': 'rgb(var(--p-soft-foreground) / <alpha-value>)',
          light: 'rgb(var(--p-light) / <alpha-value>)',
          '50': 'rgb(var(--p-50) / <alpha-value>)',
          '100': 'rgb(var(--p-100) / <alpha-value>)',
          '200': 'rgb(var(--p-200) / <alpha-value>)',
          '300': 'rgb(var(--p-300) / <alpha-value>)',
          '400': 'rgb(var(--p-400) / <alpha-value>)',
          '500': 'rgb(var(--p-500) / <alpha-value>)',
          '600': 'rgb(var(--p-600) / <alpha-value>)',
          '700': 'rgb(var(--p-700) / <alpha-value>)',
          '800': 'rgb(var(--p-800) / <alpha-value>)',
          '900': 'rgb(var(--p-900) / <alpha-value>)',
          foreground: '#ffffff',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
          yellow: '#FFEB3B',
          blue: '#2196F3',
          cream: '#F5E6CC',
          orange: '#FF9800',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        /* --- Sister project (emerald) tokens for /account, /share, /contact, etc. --- */
        bg2: 'var(--bg-soft)',
        bg3: 'var(--bg-muted)',
        border2: 'var(--border-strong)',
        text: 'var(--text-c)',
        text2: 'var(--text-muted)',
        text3: 'var(--text-faint)',
        accent2: 'var(--c-accent-hover)',
        brand: {
          50: 'var(--brand-50)',
          100: 'var(--brand-100)',
          200: 'var(--brand-200)',
          300: 'var(--brand-300)',
          400: 'var(--brand-400)',
          500: 'var(--brand-500)',
          600: 'var(--brand-600)',
          700: 'var(--brand-700)',
          800: 'var(--brand-800)',
          DEFAULT: 'var(--brand-600)',
        },
        /* --- Teklif platformu tokenları (ortak tasarım) --- */
        sidebar: {
          DEFAULT: '#0f172a',
          foreground: '#cbd5e1',
          muted: '#94a3b8',
          border: '#1e293b',
          accent: '#047857',
          'accent-foreground': '#ecfdf5',
        },
        success: { DEFAULT: '#059669', foreground: '#ffffff', soft: '#ecfdf5', 'soft-foreground': '#047857' },
        warning: { DEFAULT: '#d97706', foreground: '#ffffff', soft: '#fffbeb', 'soft-foreground': '#b45309' },
        info: { DEFAULT: '#2563eb', foreground: '#ffffff', soft: '#eff6ff', 'soft-foreground': '#1d4ed8' },
        green: { DEFAULT: 'var(--c-green)' },
        blue: { DEFAULT: 'var(--c-blue)', dark: 'var(--c-blue2)' },
        red: { DEFAULT: 'var(--c-red)' },
        yellow: { DEFAULT: 'var(--c-yellow)', dark: 'var(--c-yellow-dark)' },
        purple: { DEFAULT: 'var(--c-purple)' },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        shimmer: 'shimmer 2s infinite linear',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;

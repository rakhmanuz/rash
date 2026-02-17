/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-plus-jakarta)', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        // Assistant Admin design system
        'assistant-bg': {
          primary: '#0a0e1a',
          secondary: '#111827',
          tertiary: '#1a2236',
          elevated: '#1e293b',
        },
        'assistant-accent': {
          DEFAULT: '#6366f1',
          hover: '#818cf8',
          muted: 'rgba(99, 102, 241, 0.12)',
          glow: 'rgba(99, 102, 241, 0.25)',
        },
      },
      borderRadius: {
        'assistant-sm': '6px',
        'assistant-md': '10px',
        'assistant-lg': '14px',
        'assistant-xl': '20px',
      },
      boxShadow: {
        'assistant-card': '0 1px 2px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.2)',
        'assistant-elevated': '0 4px 6px rgba(0,0,0,0.3), 0 12px 40px rgba(0,0,0,0.4)',
        'assistant-glow': '0 0 0 3px rgba(99, 102, 241, 0.15), 0 0 20px rgba(99, 102, 241, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}

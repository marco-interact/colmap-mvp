import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // DoMapping Brand Colors (migrated from LESS)
        brand: {
          primary: '#4ECDC4',   // Turquoise accent
          secondary: '#1a1a1a', // Dark background
          accent: '#4ECDC4',
        },
        background: {
          primary: '#111111',   // Main dark background
          secondary: '#1a1a1a', // Card/container background
          tertiary: '#2a2a2a',  // Hover/elevated background
        },
        text: {
          primary: '#ffffff',   // Main text
          secondary: '#b3b3b3', // Muted text
          muted: '#666666',     // Very muted text
        },
        border: {
          primary: '#333333',   // Main borders
          secondary: '#444444', // Lighter borders
        },
        success: '#22c55e',
        warning: '#f59e0b', 
        error: '#ef4444',
        info: '#3b82f6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s infinite',
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
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
  darkMode: 'class',
}
export default config

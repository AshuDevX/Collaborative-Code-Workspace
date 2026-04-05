/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['JetBrains Mono', 'monospace'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Syne', 'sans-serif'],
      },
      colors: {
        bg: {
          primary: '#0a0a0f',
          secondary: '#0f0f1a',
          tertiary: '#141420',
          elevated: '#1a1a2e',
          hover: '#1f1f35',
        },
        accent: {
          purple: '#7c3aed',
          'purple-bright': '#8b5cf6',
          'purple-glow': '#a78bfa',
          cyan: '#06b6d4',
          'cyan-bright': '#22d3ee',
          green: '#10b981',
          red: '#ef4444',
          orange: '#f97316',
          yellow: '#eab308',
        },
        border: {
          subtle: '#1e1e32',
          default: '#252540',
          bright: '#3a3a5c',
        },
        text: {
          primary: '#e8e8f0',
          secondary: '#9898b0',
          muted: '#5a5a78',
          accent: '#a78bfa',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'cursor-blink': 'cursorBlink 1s step-end infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideIn: { from: { transform: 'translateX(-10px)', opacity: 0 }, to: { transform: 'translateX(0)', opacity: 1 } },
        slideUp: { from: { transform: 'translateY(10px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        pulseGlow: { '0%, 100%': { boxShadow: '0 0 8px rgba(124, 58, 237, 0.4)' }, '50%': { boxShadow: '0 0 20px rgba(124, 58, 237, 0.8)' } },
        cursorBlink: { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0 } },
      },
      boxShadow: {
        'glow-purple': '0 0 20px rgba(124, 58, 237, 0.3)',
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.3)',
        'panel': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'modal': '0 20px 60px rgba(0, 0, 0, 0.6)',
      },
    },
  },
  plugins: [],
}

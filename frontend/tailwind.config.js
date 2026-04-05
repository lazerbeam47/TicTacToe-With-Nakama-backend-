/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
        body:    ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        ink:    '#0A0A0F',
        dim:    '#141420',
        panel:  '#1C1C2E',
        border: '#2A2A45',
        neon:   '#00FFB2',
        coral:  '#FF4F6D',
        gold:   '#FFD166',
        muted:  '#6B6B8A',
      },
      animation: {
        'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
        'slide-up':   'slide-up 0.4s cubic-bezier(0.16,1,0.3,1)',
        'pop':        'pop 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        'glow':       'glow 1.5s ease-in-out infinite alternate',
      },
      keyframes: {
        'pulse-neon': {
          '0%,100%': { opacity: '1' },
          '50%':     { opacity: '0.5' },
        },
        'slide-up': {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        'pop': {
          from: { transform: 'scale(0.7)', opacity: '0' },
          to:   { transform: 'scale(1)',   opacity: '1' },
        },
        'glow': {
          from: { textShadow: '0 0 10px #00FFB2, 0 0 20px #00FFB240' },
          to:   { textShadow: '0 0 20px #00FFB2, 0 0 40px #00FFB280' },
        },
      },
    },
  },
  plugins: [],
}

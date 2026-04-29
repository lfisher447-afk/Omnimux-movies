import type { Config } from "tailwindcss";
export default {
  content:["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: { 
    extend: {
      animation: {
        'niconico': 'slideLeft 8s linear forwards',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite'
      },
      keyframes: {
        slideLeft: { '0%': { transform: 'translateX(100vw)' }, '100%': { transform: 'translateX(-100vw)' } },
        pulseGlow: { '0%, 100%': { boxShadow: '0 0 40px rgba(255,255,255,0.1)' }, '50%': { boxShadow: '0 0 60px rgba(255,255,255,0.3)' } }
      }
    } 
  },
  plugins:[],
} satisfies Config;

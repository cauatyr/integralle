import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Identidade preto + dourado do Instituto Integralle
        preto: {
          DEFAULT: '#0A0A0A',
          900: '#0A0A0A',
          800: '#121212',
          700: '#161616',
          600: '#1E1E1E',
          500: '#262626',
        },
        ouro: {
          DEFAULT: '#C9A227',
          claro: '#E2C15A',
          escuro: '#8A6D1A',
          50: 'rgba(201,162,39,0.08)',
        },
        // Cores fixas dos profissionais (diferenciação na agenda)
        henrique: '#3B82F6', // azul
        eduardo: '#F5F5F5', // branco
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config

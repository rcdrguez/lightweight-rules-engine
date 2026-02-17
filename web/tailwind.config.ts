import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './features/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './data/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem'
      },
      colors: {
        slatebrand: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          700: '#334155',
          900: '#0f172a'
        }
      },
      boxShadow: {
        soft: '0 20px 45px -30px rgba(15, 23, 42, 0.3)'
      }
    }
  },
  plugins: []
};

export default config;

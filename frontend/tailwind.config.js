/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0a0e14',
          800: '#0f1419',
          700: '#151b24',
          600: '#1c2333',
          500: '#243045',
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
        },
        link: {
          excellent: '#10b981',
          good: '#22d3ee',
          regular: '#f59e0b',
          marginal: '#f97316',
          critical: '#ef4444',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

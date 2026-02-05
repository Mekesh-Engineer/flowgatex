/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // KEC Blue & Green Theme Colors
        primary: {
          50: '#e6f7fc',
          100: '#cceff9',
          200: '#99dff3',
          300: '#66cfed',
          400: '#33bfe7', // KEC Cyan-Blue Light
          500: '#00A3DB', // KEC Cyan-Blue (Main)
          600: '#0082af',
          700: '#006283',
          800: '#004157',
          900: '#00212c',
          950: '#001016',
        },
        secondary: {
          50: '#f5fce8',
          100: '#ebf9d1',
          200: '#d7f3a3',
          300: '#c3ed75',
          400: '#afe747', // KEC Lime-Green Light
          500: '#A3D639', // KEC Lime-Green (Main)
          600: '#82ab2e',
          700: '#628022',
          800: '#415517',
          900: '#212b0b',
          950: '#101506',
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#0a0a0f', // Main background
        },
        surface: {
          DEFAULT: '#12121a',
          light: '#1a1a24',
          dark: '#0a0a0f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 163, 219, 0.3)', // KEC Blue glow
        'glow-lg': '0 0 40px rgba(0, 163, 219, 0.4)',
        'glow-secondary': '0 0 20px rgba(163, 214, 57, 0.3)', // KEC Green glow
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, #0a0a0f 0%, #12121a 50%, #1a1a24 100%)',
        'card-gradient': 'linear-gradient(180deg, rgba(0, 163, 219, 0.1) 0%, rgba(163, 214, 57, 0.05) 100%)', // KEC Blue to Green
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 163, 219, 0.3)' }, // KEC Blue
          '50%': { boxShadow: '0 0 30px rgba(0, 163, 219, 0.5)' },
        },
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}

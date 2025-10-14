/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      keyframes: {
        'slide-down': {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      },
      animation: {
        'slide-down': 'slide-down 0.3s ease-out'
      },
      colors: {
        primary: {
          50: '#e6fff3',
          100: '#b3ffe0',
          200: '#80ffcd',
          300: '#65ff8f',
          400: '#34ff76',
          500: '#03ef62',
          600: '#00c74e',
          700: '#009f3e',
          800: '#00772e',
          900: '#004f1e',
        },
        datacamp: {
          // Brand colors
          brand: '#03ef62',
          green: '#03ef62',
          blue: '#5eb1ff',
          red: '#dd3400',
          orange: '#ff931e',
          warning: '#ff931e',
          info: '#5eb1ff',
          success: '#03ef62',

          // Light theme
          'bg-main': '#f7f7fc',
          'bg-secondary': '#efeff5',
          'bg-tertiary': '#e8e8ee',
          'bg-contrast': '#ffffff',

          // Dark theme
          'dark-bg-main': '#05192d',
          'dark-bg-secondary': '#13253a',
          'dark-bg-tertiary': '#000820',
          'dark-bg-contrast': '#213147',

          // Text colors (light)
          'text-primary': '#05192d',
          'text-secondary': '#213147',
          'text-subtle': '#5d6a77',
          'text-inverse': '#ffffff',

          // Text colors (dark)
          'dark-text-primary': '#efeff5',
          'dark-text-secondary': '#e1e1e8',
          'dark-text-subtle': '#9ba3ab',
          'dark-text-inverse': '#05192d',
        },
      },
    },
  },
  plugins: [],
}

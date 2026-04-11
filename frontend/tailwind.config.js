/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        warm: {
          50:  '#FDF8F0',
          100: '#FAF0E0',
          200: '#F0DEC8',
          300: '#E0C5A0',
          400: '#C4956A',
          500: '#A87040',
          600: '#8B5E3C',
          700: '#6B4730',
          800: '#4D3222',
          900: '#3D2B1F',
        },
        blush: {
          50:  '#FFF5F5',
          100: '#FFE8E8',
          200: '#FFCECE',
          300: '#F8A8A8',
          400: '#E88080',
          500: '#D46060',
        },
      },
      fontFamily: {
        serif: ['Lora', 'Georgia', 'serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        warm: '0 2px 16px 0 rgba(139, 94, 60, 0.10)',
        'warm-lg': '0 4px 32px 0 rgba(139, 94, 60, 0.14)',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dourado: '#f0a830',
        'dourado-deep': '#d48a1f',
        azul: '#1b3a5c',
        'azul-light': '#2d5a8c',
      },
      fontFamily: {
        serif: ['Instrument Serif', 'serif'],
        sans: ['Barlow', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'aurora': 'aurora 4s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        aurora: {
          '0%, 100%': { opacity: 0.3, filter: 'blur(20px)' },
          '50%': { opacity: 0.8, filter: 'blur(10px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};

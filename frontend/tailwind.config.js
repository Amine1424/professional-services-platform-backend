/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  safelist: [
    'line-clamp-2',
    'from-orange-400',
    'to-pink-500',
    'from-blue-500',
    'to-cyan-500',
    'from-emerald-400',
    'to-teal-500',
    'from-slate-600',
    'to-slate-900',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 18px 50px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
};

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'jua': ['Jua', 'sans-serif'],
        'noto': ['Noto Sans KR', 'sans-serif'],
      },
      colors: {
        'stage1': '#d1fae5',
        'stage1-dark': '#065f46',
        'stage2': '#dbeafe',
        'stage2-dark': '#1e40af',
        'stage3': '#ede9fe',
        'stage3-dark': '#5b21b6',
        'stage4': '#ffedd5',
        'stage4-dark': '#9a3412',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
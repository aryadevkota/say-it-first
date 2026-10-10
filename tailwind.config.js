/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/presentation/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        slateWarm: '#0F141C',
        navyCard: '#1A2232',
        violetSubtext: '#8B5CF6',
        sageAccent: '#10B981',
      },
    },
  },
  plugins: [],
};

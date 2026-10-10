/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/presentation/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: {
          light: '#FAF7F2',
          subtle: '#F4EFEB',
          surface: '#FFFFFF',
          border: '#E7E1D8',
          borderSubtle: '#F0ECE4',
          dark: '#14181E',
          darkSubtle: '#1A2129',
          darkSurface: '#212933',
          darkBorder: '#2E3A47',
        },
        ink: {
          primary: '#13282B',
          secondary: '#364B4E',
          muted: '#627678',
          light: '#FAF9F6',
          lightMuted: '#9BA8A9',
        },
        teal: {
          brand: '#1C6E72',
          hover: '#15565A',
          active: '#104346',
          subtle: '#E7F2F2',
          border: '#B6D8D9',
        },
        topic: {
          apricot: '#D97153',
          apricotBg: '#FDF4F1',
          apricotBorder: '#F6D2C8',
          lavender: '#6E619E',
          lavenderBg: '#F5F3FA',
          lavenderBorder: '#DAD4EB',
          sage: '#487A5B',
          sageBg: '#F1F7F3',
          sageBorder: '#C7E0D1',
          amber: '#BD803D',
          amberBg: '#FDF7EE',
          amberBorder: '#EED9BF',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['"Dream Orphans"', 'system-ui', 'sans-serif'],
        accent: ['"Caviar Dreams"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

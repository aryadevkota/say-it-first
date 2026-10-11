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
          light: '#EAF0FF',         // Base light mist blue / icy periwinkle
          subtle: '#F4F7FF',        // Soft airy periwinkle surface
          surface: 'rgba(255, 255, 255, 0.78)', // Frosted white with cool undertone
          surfaceSolid: '#FFFFFF',
          surfaceStrong: '#DCE6FF', // Luminous periwinkle surface
          border: 'rgba(86, 104, 191, 0.16)', // Gentle periwinkle border
          borderSubtle: 'rgba(86, 104, 191, 0.08)',
          borderHover: 'rgba(94, 106, 217, 0.40)',
          dark: '#0F1426',
          darkSubtle: '#171E38',
          darkSurface: '#1F294D',
          darkBorder: 'rgba(184, 183, 247, 0.18)',
        },
        ink: {
          primary: '#1D275C',       // Deep indigo/navy primary text
          secondary: '#3E4A82',     // Medium indigo
          muted: '#6C76A8',         // Muted blue-gray secondary text
          light: '#F4F7FF',
          lightMuted: '#B8B7F7',
        },
        sif: {
          primary: '#5E6AD9',       // Brand periwinkle / soft indigo from logo
          primaryDeep: '#27348B',   // Deep periwinkle / navy anchor
          primaryHover: '#4D58C7',
          primarySubtle: '#E8ECFF',
          secondary: '#B8B7F7',     // Lavender / lilac accent
          secondarySubtle: '#F0EFFF',
          accent: '#D9B6F2',        // Restrained pink-violet accent
          accentSubtle: '#FAF0FF',
          border: 'rgba(94, 106, 217, 0.22)',
        },
        // Backwards compatibility aliases mapped to brand periwinkle
        teal: {
          brand: '#5E6AD9',
          hover: '#4D58C7',
          active: '#27348B',
          subtle: '#E8ECFF',
          border: 'rgba(94, 106, 217, 0.25)',
        },
        topic: {
          apricot: '#7B61FF',       // Shifted to brand-family violet
          apricotBg: '#F3F0FF',
          apricotBorder: '#D8CEFE',
          lavender: '#6E619E',
          lavenderBg: '#F5F3FA',
          lavenderBorder: '#DAD4EB',
          sage: '#5A75B8',          // Soft slate blue
          sageBg: '#EFF4FD',
          sageBorder: '#CDDCF8',
          amber: '#6877C4',         // Periwinkle-indigo
          amberBg: '#EFF2FC',
          amberBorder: '#CAD5F5',
        },
      },
      boxShadow: {
        'glass-card': '0 8px 32px 0 rgba(94, 106, 217, 0.10), 0 1px 3px 0 rgba(255, 255, 255, 0.8) inset',
        'glass-elevated': '0 16px 40px 0 rgba(94, 106, 217, 0.16), 0 1px 4px 0 rgba(255, 255, 255, 0.9) inset',
        'glass-glow': '0 0 24px 0 rgba(217, 182, 242, 0.25)',
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

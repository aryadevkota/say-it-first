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
          light: '#F2F5FD',         // Clean, readable learning-platform canvas (mist blue)
          subtle: '#E8EFFC',        // Calm contrast layer for subtle wells/panels
          surface: '#FFFFFF',       // Primary opaque card surface (crisp contrast & WCAG AA)
          surfaceSubtle: 'rgba(255, 255, 255, 0.92)',
          surfaceSolid: '#FFFFFF',
          surfaceStrong: '#DCE6FF', // Selected periwinkle fill
          border: 'rgba(39, 52, 139, 0.12)', // Definitive readable border (no washed-out bleed)
          borderSubtle: 'rgba(39, 52, 139, 0.06)',
          borderHover: 'rgba(94, 106, 217, 0.45)',
          dark: '#0F1426',
          darkSubtle: '#171E38',
          darkSurface: '#1F294D',
          darkBorder: 'rgba(184, 183, 247, 0.18)',
        },
        ink: {
          primary: '#141D47',       // Ultra-crisp deep indigo/navy primary text (WCAG AAA)
          secondary: '#2C3A73',     // Highly legible secondary body text
          muted: '#5B6899',         // Muted metadata & supporting details (WCAG AA compliant)
          light: '#F4F7FF',
          lightMuted: '#B8B7F7',
        },
        sif: {
          primary: '#4F5CD1',       // High-contrast primary action periwinkle (logo-aligned)
          primaryDeep: '#232E7A',   // Deep periwinkle / navy anchor
          primaryHover: '#3F4ABF',  // Focused hover state
          primarySubtle: '#EAEFFF', // Active tab & tag background fill
          secondary: '#9D9BF0',     // Restrained lilac accent
          secondarySubtle: '#F3F2FE',
          accent: '#D4A8F2',        // Delicate pink-violet accent
          accentSubtle: '#FAF2FF',
          border: 'rgba(79, 92, 209, 0.22)',
        },
        // Backwards compatibility aliases
        teal: {
          brand: '#4F5CD1',
          hover: '#3F4ABF',
          active: '#232E7A',
          subtle: '#EAEFFF',
          border: 'rgba(79, 92, 209, 0.22)',
        },
        topic: {
          apricot: '#6B54E6',
          apricotBg: '#F3F0FF',
          apricotBorder: '#D8CEFE',
          lavender: '#60548E',
          lavenderBg: '#F5F3FA',
          lavenderBorder: '#DAD4EB',
          sage: '#4D68A8',
          sageBg: '#EFF4FD',
          sageBorder: '#CDDCF8',
          amber: '#5B6AB8',
          amberBg: '#EFF2FC',
          amberBorder: '#CAD5F5',
        },
      },
      borderRadius: {
        'card': '16px',             // Rounded rectangles for content surfaces, reports & forms
        'card-lg': '20px',          // Major container cards
        'pill': '9999px',           // Strictly for buttons, tags, chips & small filters
        'dialog': '24px',           // High-value modals and practice stages
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(20, 29, 71, 0.05), 0 1px 2px -1px rgba(20, 29, 71, 0.05)',
        'card-hover': '0 8px 24px -4px rgba(39, 52, 139, 0.10), 0 2px 6px -1px rgba(39, 52, 139, 0.04)',
        'modal': '0 20px 48px -12px rgba(20, 29, 71, 0.22), 0 1px 3px 0 rgba(20, 29, 71, 0.08)',
        // Controlled glass highlights for featured heroic moments only
        'featured-glass': '0 16px 40px -8px rgba(79, 92, 209, 0.16), inset 0 1px 0 0 rgba(255, 255, 255, 0.9)',
        'glass-glow': '0 0 20px 0 rgba(212, 168, 242, 0.20)',
        'glass-card': '0 4px 20px 0 rgba(39, 52, 139, 0.07)',
        'glass-elevated': '0 12px 32px 0 rgba(39, 52, 139, 0.12)',
      },
      transitionTimingFunction: {
        'perplexity': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'page-enter': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'tab-fade': {
          '0%': { opacity: '0.4' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'page-enter': 'page-enter 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'tab-fade': 'tab-fade 160ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
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

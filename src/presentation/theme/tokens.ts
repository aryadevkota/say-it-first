/**
 * tokens.ts — Creative Design Tokens
 *
 * Warm, adult, beautifully composed sensory-friendly design tokens:
 * - Canvas: Warm Ivory / Alabaster or Deep Quiet Studio Charcoal
 * - Typography: Deep Forest Ink & Warm Slate
 * - Accents: Muted Sea Teal with restrained Apricot, Lavender, and Sage
 * - Surfaces: Gentle rounded corners, calm elevation, generous whitespace
 */

export const designTokens = {
  colors: {
    // Light Canvas Palette (Primary Experience)
    canvas: {
      light: '#FAF7F2',
      lightSubtle: '#F4EFEB',
      lightSurface: '#FFFFFF',
      lightBorder: '#E7E1D8',
      lightBorderSubtle: '#F0ECE4',
    },
    // Dark Canvas Palette (Quiet Studio Mode)
    canvasDark: {
      dark: '#14181E',
      darkSubtle: '#1A2129',
      darkSurface: '#212933',
      darkBorder: '#2E3A47',
      darkBorderSubtle: '#26303B',
    },
    // Deep Ink Typography
    ink: {
      primary: '#13282B',
      secondary: '#364B4E',
      muted: '#627678',
      light: '#FAF9F6',
      lightMuted: '#9BA8A9',
    },
    // Primary Interactive Accent (Muted Teal)
    teal: {
      default: '#1C6E72',
      hover: '#15565A',
      active: '#104346',
      subtle: '#E7F2F2',
      border: '#B6D8D9',
    },
    // Topic Identity Accents (Restrained)
    topics: {
      apricot: {
        base: '#D97153',
        bg: '#FDF4F1',
        border: '#F6D2C8',
        text: '#943E26',
      },
      lavender: {
        base: '#6E619E',
        bg: '#F5F3FA',
        border: '#DAD4EB',
        text: '#453874',
      },
      sage: {
        base: '#487A5B',
        bg: '#F1F7F3',
        border: '#C7E0D1',
        text: '#285539',
      },
      amber: {
        base: '#BD803D',
        bg: '#FDF7EE',
        border: '#EED9BF',
        text: '#7A4D19',
      },
    },
  },
  typography: {
    fontSans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Atkinson Hyperlegible', sans-serif",
    lineHeightComfortable: '1.65',
    lineHeightHeading: '1.25',
  },
  radii: {
    sm: '0.5rem',     // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '2rem',    // 32px
    full: '9999px',
  },
  shadows: {
    card: '0 2px 8px -1px rgba(19, 40, 43, 0.05), 0 1px 3px -1px rgba(19, 40, 43, 0.03)',
    elevated: '0 10px 25px -4px rgba(19, 40, 43, 0.07), 0 4px 8px -2px rgba(19, 40, 43, 0.03)',
  },
  transitions: {
    default: '200ms cubic-bezier(0.16, 1, 0.3, 1)',
    linear: '200ms linear',
  },
} as const;

/** @type {import('tailwindcss').Config} */
import { colors, fonts, motion } from './src/styles/tokens.js'

// Dynamically generate distinct HSL hues for up to 32 timeline tracks
const trackColors = Object.fromEntries(
  Array.from({ length: 32 }, (_, i) => [
    `track-${i}`,
    `hsl(${(i * 40) % 360} 70% 35% / 0.5)`
  ]),
)

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'panel-bg': colors.panelBg,
        'panel-bg-secondary': colors.panelBgSecondary,
        accent: colors.accent,
        'text-primary': colors.textPrimary,
        'text-secondary': colors.textSecondary,
        'clip-video': colors.clipVideo,
        'clip-audio': colors.clipAudio,
        ...trackColors,
      },
      fontFamily: fonts.family,
      fontSize: {
        'ui-label': fonts.size.uiLabel,
        'ui-caption': fonts.size.uiCaption,
        'ui-body': fonts.size.uiBody,
        'ui-heading': fonts.size.uiHeading,
      },
      fontWeight: {
        'ui-normal': fonts.weight.uiNormal,
        'ui-medium': fonts.weight.uiMedium,
        'ui-semibold': fonts.weight.uiSemibold,
      },
      transitionDuration: {
        150: motion.duration150,
      },
    },
  },
  plugins: [
    // Utility to hide native scrollbars (used for virtualised clip area)
    function ({ addUtilities }) {
      addUtilities({
        '.scrollbar-none': {
          /* stylelint-disable-next-line declaration-block-no-duplicate-properties */
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
        },
        '.scrollbar-none::-webkit-scrollbar': {
          display: 'none',
        },
      })
    },
  ],
}


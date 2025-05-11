/** @type {import('tailwindcss').Config} */
import { colors, fonts, motion } from './src/styles/tokens.js'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'panel-bg': colors.panelBg,
        accent: colors.accent,
        'clip-video': colors.clipVideo,
        'clip-audio': colors.clipAudio,
      },
      fontFamily: fonts.family,
      fontSize: {
        'ui-label': fonts.size.uiLabel,
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
  plugins: [],
}


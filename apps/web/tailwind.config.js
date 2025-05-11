/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'panel-bg': '#101012',
        'accent': '#4E8CFF',
        'clip-video': 'rgba(30,144,255,.5)',
        'clip-audio': 'rgba(255,64,128,.5)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      fontSize: {
        'ui-label': '11px', // For labels: Inter 11/500
        'ui-body': '14px',  // For body text: Inter 14/400
        'ui-heading': '24px', // For headings: Inter 24/600
      },
      fontWeight: {
        'ui-normal': '400',   // For body text
        'ui-medium': '500',   // For labels
        'ui-semibold': '600', // For headings
      },
      transitionDuration: {
        '150': '150ms',
      },
      // It's also common to define animation keyframes for fades if more complex fades are needed
      // For simple opacity fades, Tailwind's built-in opacity and duration utilities are often sufficient.
    },
  },
  plugins: [],
}


/** @type {import('tailwindcss').Config} */
export default {
  // Scan the source for utility classes so they get generated.
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  // IMPORTANT: preflight is Tailwind's global base reset. This app ships its own
  // hand-written CSS (styles.css / catalog.css / theme.css), so enabling
  // preflight would clobber those pages. We disable it and rely only on the
  // opt-in utility classes (which do nothing unless applied via className).
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {},
  },
  plugins: [],
};

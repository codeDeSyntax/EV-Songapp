/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors:{
        background:"#faeed1",
        primary: '#9a674a',
        bgray:"#292524",
        ltgray:"#1c1917",
        vmprim:"#9a674a",
        dtext:"#f2cdb4",
      },
      fontFamily: {
        anton: ['"Anton SC"', 'sans-serif'],
        bigshoulders: ['"Big Shoulders Thin"', 'sans-serif'],
        bitter: ['"Bitter Thin"', 'sans-serif'],
        oswald: ['"Oswald ExtraLight"', 'sans-serif'],
        archivo: ['"Archivo Black"', 'sans-serif'],
        roboto: ['"Roboto Thin"', 'sans-serif'],
        cooper: ['"Cooper Black"', 'sans-serif'],
        haettenschweiler: ['"Haettenschweiler"', 'sans-serif'],
        impact: ['"Impact"', 'sans-serif'],
        teko: ['"Teko Light"', 'sans-serif'],
        alumini: ['"Alumini Sans Black"', 'sans-serif'],
        LTFuzz: ['"LTFuzz"', 'sans-serif'],
        ThePriest: ['"thepriest"', 'sans-serif'],
      },

    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        ".no-scrollbar": {
          "-ms-overflow-style": "none", // IE and Edge
          "scrollbar-width": "none", // Firefox
        },
        ".no-scrollbar::-webkit-scrollbar": {
          display: "none", // Chrome, Safari, Opera
        },
        '.thin-scrollbar': {
          'scrollbar-width': 'thin',
          '&::-webkit-scrollbar': {
            width: '6px', // Adjust width as needed
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#5ECFFF', // Optional: Customize the scrollbar color
          },
        },
      });
    },
  ],
}
export const darkMode = 'class';

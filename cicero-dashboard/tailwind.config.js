/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#ecf7ff",
          100: "#c7e8fa",
          200: "#9fd6ee",
          300: "#79c4e0",
          DEFAULT: "#38a1c4",
          600: "#1d6b87",
          700: "#124a61",
        },
        collab: {
          50: "#f5f2ff",
          100: "#e7deff",
          200: "#d3c5ff",
          DEFAULT: "#bba0ff",
        },
        accent: {
          50: "#fff4e8",
          100: "#ffe3c6",
          200: "#ffcf9d",
          DEFAULT: "#ff995f",
        },
        neutral: {
          navy: "#1d2746",
          slate: "#3a4a66",
          mist: "#5c6a81",
        },
      },
    },
  },
  plugins: [],
};

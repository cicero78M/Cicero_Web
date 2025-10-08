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
        trust: {
          50: "#f1fbff",
          100: "#d8f4f8",
          200: "#b6e7ed",
          300: "#8fd8df",
          400: "#63c8d0",
          DEFAULT: "#3ab6c0",
          600: "#25959f",
        },
        consistency: {
          50: "#f6f2ff",
          100: "#ebe2ff",
          200: "#d8c9ff",
          300: "#c0a7ff",
          400: "#a784f7",
          DEFAULT: "#8c65e8",
          600: "#6f4fc6",
        },
        spirit: {
          50: "#fff3f5",
          100: "#ffdfe6",
          200: "#ffc3cf",
          300: "#ffa1b1",
          400: "#ff7e91",
          DEFAULT: "#ff6f8a",
          600: "#e25671",
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

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts,scss}"],
  theme: {
    extend: {
      colors: {
        primary: "#224063",
        gray: {
          50: "#f8f9fa",
        },
        bluegray: {
          100: "#dadee3",
        },
      },
      spacing: {
        "screen-lg": "1180px",
      },
      screens: {
        lg: "1180px",
      },
    },
  },
  plugins: [],
};

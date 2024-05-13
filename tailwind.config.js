/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts,scss}"],
  theme: {
    fontSize: {
      "sm": "0.65625rem",
      "base": "0.875rem",
      "lg": "1.09375rem",
      "xl": "1.3125rem",
      "2xl": "1.53125rem",
      "3xl": "1.75rem",
      "4xl": "2.1875rem"
    },
    lineHeight: {
      "normal": "normal",
      "sm": "90%",
      "base": "100%",
      "lg": "120%",
      "xl": "150%",
    },
    extend: {
      colors: {
        primary: "#224063",
        gray: {
          50: "#f8f9fa",
          primary: "#495057",
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

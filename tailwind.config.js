/** @type {import('tailwindcss').Config} */

const sidebarWidth = 15 * 16;
const sidebarWidthSm = 52;
const maxContentWidth = 1180;

module.exports = {
  content: ["./src/**/*.{html,ts,scss}"],
  theme: {
    fontSize: {
      "sm": "0.75rem",
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
        text: {
          primary: "#495057",
          secondary: "#6C757D",
        },
        gray: {
          50: "#f8f9fa",
          primary: "#495057",
        },
        bluegray: {
          100: "#dadee3",
        },
      },
      spacing: {
        "sidebar": "180px",
        "sidebar-sm": "52px",
        "content-xl": "1180px",
      },
      screens: {
        'xl-sidebar-sm': { max: `${maxContentWidth + 2 * sidebarWidthSm}px` },
        'xl-sidebar': { max: `${maxContentWidth + 2 * sidebarWidth}px` }
      },
    },
  },
  plugins: [],
};

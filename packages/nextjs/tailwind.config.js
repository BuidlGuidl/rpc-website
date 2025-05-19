/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./utils/**/*.{js,ts,jsx,tsx}"],
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        light: {
          primary: "#93BBFB",
          "primary-content": "#212638",
          secondary: "#DAE8FF",
          "secondary-content": "#212638",
          accent: "#93BBFB",
          "accent-content": "#212638",
          neutral: "#212638",
          "neutral-content": "#ffffff",
          "base-100": "#ffffff",
          "base-200": "#f4f8ff",
          "base-300": "#DAE8FF",
          "base-content": "#212638",
          info: "#93BBFB",
          success: "#34EEB6",
          warning: "#FFCF72",
          error: "#FF8863",
          "--rounded-btn": "9999rem",
          ".tooltip": { "--tooltip-tail": "6px" },
          ".link": { textUnderlineOffset: "2px" },
          ".link:hover": { opacity: "80%" },
        },
      },
    ],
  },
  theme: {
    extend: {
      fontFamily: {
        chivo: ["Chivo Mono", "monospace"],
      },
      backgroundColor: {
        skin: "#EBECFD",
      },
      boxShadow: { center: "0 0 12px -2px rgb(0 0 0 / 0.05)" },
      animation: {
        "pulse-fast": "pulse 1.5s cubic-bezier(.57,.21,.69,1.25) infinite",
        "animate-ping": "ping 1s ease-in-out infinite",
      },
      screens: {
        lg: "1145px",
      },
    },
  },
};

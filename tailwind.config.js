/** @type {import('tailwindcss').Config} */
module.exports = {
  // Add NativeWind preset for React Native support
  presets: [require("nativewind/preset")],
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#00A86B", // main green
        "primary-700": "#008f58",
      },
    },
  },
  plugins: [],
};

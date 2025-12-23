import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        curio: {
          primary: "#265ba3",
          "primary-hover": "#1e539c",
        },
      },
    },
  },
  plugins: [],
};

export default config;

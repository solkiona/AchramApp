// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        achrams: {
          primary: {
            50: '#f0fdf7', // Optional: very light green
            100: '#dcfce7', // Optional: light green
            500: '#06b27c', // Base primary
            600: '#059669', // Darker primary
            700: '#0d9488', // Even darker primary
          },
          secondary: {
            500: '#0da9a0', // Base secondary
            600: '#0d9488', // Darker secondary
            700: '#0891b2', // Even darker secondary
          },
          text: {
            primary: '#171717', // Your chosen dark text
            secondary: '#6b7280', // Muted text
            light: '#f9fafb',  // Light text on dark backgrounds
          },
          background: {
            primary: '#ffffff', // Your chosen white background
            secondary: '#f9fafb', // Light gray background
            card: '#ffffff', // Card backgrounds
          },
          border: '#e5e7eb', // Border color
        },
      },
      backgroundImage: {
        'achrams-gradient-primary': 'linear-gradient(135deg, #06b27c 0%, #059669 40%, #0d9488 100%)',
        'achrams-gradient-secondary': 'linear-gradient(135deg, #0da9a0 0%, #0d9488 45%, #0891b2 100%)',
      },
    },
  },
  plugins: [],
};
export default config;
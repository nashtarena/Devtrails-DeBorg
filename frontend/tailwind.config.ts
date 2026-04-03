import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        border: "hsl(215, 20%, 92%)",
        input: "hsl(215, 20%, 92%)",
        ring: "hsl(217, 91%, 50%)",
        background: "hsl(210, 20%, 98%)",
        foreground: "hsl(220, 20%, 10%)",
        primary: {
          DEFAULT: "hsl(217, 91%, 50%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        secondary: {
          DEFAULT: "hsl(215, 25%, 95%)",
          foreground: "hsl(220, 20%, 25%)",
        },
        destructive: {
          DEFAULT: "hsl(0, 72%, 55%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        muted: {
          DEFAULT: "hsl(215, 20%, 96%)",
          foreground: "hsl(215, 15%, 52%)",
        },
        accent: {
          DEFAULT: "hsl(152, 60%, 45%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        popover: {
          DEFAULT: "hsl(0, 0%, 100%)",
          foreground: "hsl(220, 20%, 10%)",
        },
        card: {
          DEFAULT: "hsl(0, 0%, 100%)",
          foreground: "hsl(220, 20%, 10%)",
        },
        si: {
          blue: {
            50: "hsl(214, 100%, 97%)",
            100: "hsl(214, 95%, 93%)",
            500: "hsl(217, 91%, 50%)",
            600: "hsl(217, 91%, 42%)",
            700: "hsl(217, 91%, 34%)",
          },
          green: {
            50: "hsl(152, 76%, 96%)",
            100: "hsl(152, 60%, 88%)",
            500: "hsl(152, 60%, 45%)",
          },
          orange: {
            50: "hsl(30, 100%, 96%)",
            500: "hsl(30, 95%, 55%)",
          },
          red: {
            50: "hsl(0, 100%, 97%)",
            500: "hsl(0, 72%, 55%)",
          },
          yellow: {
            50: "hsl(45, 100%, 95%)",
            500: "hsl(45, 95%, 50%)",
          },
        },
      },
      borderRadius: {
        lg: "1rem",
        md: "calc(1rem - 2px)",
        sm: "calc(1rem - 4px)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;

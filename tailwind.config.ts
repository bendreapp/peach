import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Theme-aware colors via CSS variables (defined in globals.css)
        bg: {
          DEFAULT: "var(--color-bg)",
        },
        surface: {
          DEFAULT: "var(--color-surface)",
        },
        card: {
          DEFAULT: "var(--color-card)",
        },
        border: {
          DEFAULT: "var(--color-border)",
          hover: "var(--color-border-hover)",
        },
        ink: {
          DEFAULT: "var(--color-ink)",
          secondary: "var(--color-ink-secondary)",
          tertiary: "var(--color-ink-tertiary)",
        },

        // Brand — Sage (static, same in both themes)
        sage: {
          DEFAULT: "var(--color-sage)",
          light: "var(--color-sage-light)",
          dark: "var(--color-sage-dark)",
          accent: "#A3B7A4",
          bg: "rgba(107,126,108,0.06)",
          50: "#F0F4F0",
          100: "#DCE4DC",
          200: "#B7C4B8",
          300: "#8A9A8B",
          400: "#6B7E6C",
          500: "#4A5C4B",
          600: "#3A4A3B",
          700: "#2B372C",
          800: "#1D251D",
          900: "#0E120E",
        },

        // Accents (static)
        teal: {
          DEFAULT: "#3D6B72",
          light: "#4F7C82",
          bg: "rgba(61,107,114,0.08)",
        },
        gold: {
          DEFAULT: "#9E8554",
          light: "#C2A878",
          bg: "rgba(158,133,84,0.08)",
        },
        beige: "#E8E1D9",

        // Semantic (static)
        success: {
          DEFAULT: "#2E7D32",
          bg: "rgba(46,125,50,0.06)",
        },
        warning: {
          DEFAULT: "#E6A700",
          bg: "rgba(230,167,0,0.06)",
        },
        error: {
          DEFAULT: "#C62828",
          bg: "rgba(198,40,40,0.06)",
        },
        info: {
          DEFAULT: "#1565C0",
          bg: "rgba(21,101,192,0.06)",
        },
      },

      fontFamily: {
        sans: ["Satoshi", "sans-serif"],
      },

      borderRadius: {
        card: "16px",
        small: "10px",
        pill: "100px",
      },

      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.03)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.06)",
        sage: "0 2px 12px rgba(107,126,108,0.2)",
        "sage-hover": "0 4px 16px rgba(107,126,108,0.25)",
      },

      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-slow": "pulse 2s ease-in-out infinite",
      },

      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

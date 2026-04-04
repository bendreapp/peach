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

        // Primary — Deep sage-green (from logo)
        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
          50: "#EBF0EB",
          100: "#D4E0D4",
          200: "#A8C2A8",
          300: "#7B9E8B",
          400: "#5C7A6B",
          500: "#496158",
          600: "#3A4E46",
          700: "#2C3B34",
          800: "#1E2823",
          900: "#101412",
        },

        // Accent — Sage (pulled from logo brushstroke)
        accent: {
          DEFAULT: "var(--color-accent)",
          hover: "var(--color-accent-hover)",
          50: "#F0F5EF",
          100: "#DCE8DA",
          200: "#B8D1B5",
          300: "#8FAF8A",
          400: "#6E906A",
          500: "#567252",
          600: "#43593F",
          700: "#31412E",
          800: "#1F291D",
          900: "#0E130D",
        },

        // Legacy sage (alias to accent for backward compat)
        sage: {
          DEFAULT: "var(--color-accent)",
          light: "#A8D7CB",
          dark: "var(--color-accent-hover)",
          accent: "#A8D7CB",
          bg: "rgba(123,175,158,0.08)",
          50: "#EEF7F4",
          100: "#D3EBE5",
          200: "#A8D7CB",
          300: "#7BAF9E",
          400: "#5F9585",
          500: "#457A6C",
          600: "#336056",
          700: "#244840",
          800: "#163029",
          900: "#081813",
        },

        // Danger — Terracotta
        danger: {
          DEFAULT: "var(--color-danger)",
          hover: "var(--color-danger-hover)",
          50: "#FBF0ED",
          100: "#F5D9D2",
          200: "#E8AFA3",
          300: "#D98472",
          400: "#C0705A",
          500: "#A85A46",
          600: "#8C4636",
          700: "#6E3329",
          800: "#50221C",
          900: "#32120E",
        },

        // Warning — Amber warm
        warning: {
          DEFAULT: "var(--color-warning-color)",
          50: "#FBF4EE",
          100: "#F5E5D2",
          200: "#E9C8A0",
          300: "#D4956A",
          400: "#C07A4A",
          500: "#A8622E",
          600: "#8C4E1E",
          700: "#6E3B13",
          800: "#502A0C",
          900: "#321905",
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
        beige: "#E5E0D8",

        // Semantic (mapped to new palette)
        success: {
          DEFAULT: "#3D8B7A",
          bg: "#EAF4F1",
        },
        error: {
          DEFAULT: "#A0504A",
          bg: "#F9EDED",
        },
        info: {
          DEFAULT: "#4A6FA5",
          bg: "rgba(74,111,165,0.08)",
        },
      },

      fontFamily: {
        sans: ["Satoshi"],
      },

      borderRadius: {
        card: "12px",
        small: "8px",
        pill: "999px",
        modal: "16px",
      },

      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.08)",
        modal: "0 20px 60px rgba(0,0,0,0.12)",
        dropdown: "0 8px 24px rgba(0,0,0,0.10)",
        primary: "0 2px 8px rgba(92,122,107,0.25)",
        "primary-hover": "0 4px 14px rgba(92,122,107,0.35)",
        sage: "0 2px 8px rgba(143,175,138,0.25)",
        "sage-hover": "0 4px 14px rgba(143,175,138,0.30)",
      },

      animation: {
        "fade-in": "fadeIn 200ms ease-out",
        "fade-out": "fadeOut 80ms ease-in",
        "slide-up": "slideUp 300ms ease-out",
        "slide-in-right": "slideInRight 280ms cubic-bezier(0.32,0,0,1)",
        "scale-in": "scaleIn 200ms ease-out",
        "shimmer": "shimmer 1.4s infinite",
        "pulse-slow": "pulse 2s ease-in-out infinite",
      },

      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeOut: {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

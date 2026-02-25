/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Legacy colors (keep for backward compatibility)
        background: "#faeed1",
        primary: "#9a674a",
        bgray: "#292524",
        ltgray: "#1c1917",
        vmprim: "#9a674a",
        dtext: "#f2cdb4",

        // App Theme Colors (using CSS variables for automatic dark/light switching)
        "app-bg": "var(--app-bg)",
        "app-surface": "var(--app-surface)",
        "app-surface-hover": "var(--app-surface-hover)",
        "app-border": "var(--app-border)",
        "app-text": "var(--app-text)",
        "app-text-muted": "var(--app-text-muted)",
        "app-accent": "var(--app-accent)",

        // Shared accent colors
        "app-blue": "#3b82f6",
        "app-blue-hover": "#2563eb",
        "app-green": "#10b981",
        "app-green-hover": "#059669",
        "app-red": "#ef4444",
        "app-red-hover": "#dc2626",
        "app-orange": "#f97316",
        "app-orange-hover": "#ea580c",
      },
      fontSize: {
        // EasyWorship-inspired font sizes
        "ew-xs": ["0.688rem", { lineHeight: "1rem" }], // 11px
        "ew-sm": ["0.813rem", { lineHeight: "1.25rem" }], // 13px
        "ew-base": ["0.875rem", { lineHeight: "1.5rem" }], // 14px
        "ew-md": ["0.938rem", { lineHeight: "1.5rem" }], // 15px
        "ew-lg": ["1rem", { lineHeight: "1.75rem" }], // 16px
        "ew-xl": ["1.125rem", { lineHeight: "1.75rem" }], // 18px
        "ew-2xl": ["1.25rem", { lineHeight: "2rem" }], // 20px
        "ew-3xl": ["1.5rem", { lineHeight: "2.25rem" }], // 24px
      },
      fontFamily: {
        sans: ["Raleway", "system-ui", "sans-serif"],
        raleway: ["Raleway", "system-ui", "sans-serif"],
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        ".no-scrollbar": {
          "-ms-overflow-style": "none", // IE and Edge
          "scrollbar-width": "none", // Firefox
        },
        ".no-scrollbar::-webkit-scrollbar": {
          display: "none", // Chrome, Safari, Opera
        },
        ".thin-scrollbar": {
          "scrollbar-width": "thin",
          "&::-webkit-scrollbar": {
            width: "6px", // Adjust width as needed
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#5ECFFF", // Optional: Customize the scrollbar color
          },
        },
      });
    },
  ],
};

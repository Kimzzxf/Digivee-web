/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // earthy 60-30-10 palette — Warm Sand base, Olive Night text/
        // structure, Rose Pink CTA accent, Sage Green as the balancing
        // accent for cards/banners/dividers.
        // Keys are unchanged from the old build (pink/ink/paper/sand/smoke)
        // so every existing className cascades to the new values for free.
        pink: "#FF8DA1", // CTA accent (10%) — Rose Pink, unchanged
        ink: "#3A4032", // text & structural elements (30%) — Olive Night
        paper: "#F4EAE1", // page base (60%) — Warm Sand
        sand: "#A3B19B", // small banners / dividers / product cards — Sage Green
        smoke: "#A3B19B", // captions, kickers, hairlines — Sage Green
        ivory: "#F4EAE1", // popover/dropdown surfaces — Warm Sand
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        body: ["'Cabinet Grotesk'", "sans-serif"],
        mono: ["'Cabinet Grotesk'", "sans-serif"],
      },
      boxShadow: {
        frame: "4px 4px 0 0 #241F1A",
        "frame-sm": "2px 2px 0 0 #241F1A",
        soft: "0 30px 60px -30px rgba(36,31,26,0.22)",
        // long, low, barely-there lift for editorial photo frames
        editorial: "0 50px 80px -40px rgba(36,31,26,0.35)",
      },
      borderWidth: {
        3: "1px",
        5: "2px",
      },
      // Sharp corners everywhere, no exceptions — every rounded-* utility
      // (rounded-full included) resolves to 0px from this one place instead
      // of hand-editing each of the ~80 call sites across the app.
      borderRadius: {
        none: "0px",
        sm: "0px",
        DEFAULT: "0px",
        md: "0px",
        lg: "0px",
        xl: "0px",
        "2xl": "0px",
        "3xl": "0px",
        full: "0px",
      },
    },
  },
  plugins: [],
};

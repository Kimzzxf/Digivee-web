import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",
      injectRegister: false, // main.jsx already registers /sw.js itself
      manifest: false, // public/manifest.webmanifest is already hand-written and linked in index.html
      injectManifest: {
        // Real app-shell files only — images/fonts stay network-only,
        // this is what makes the shell boot offline, not full asset caching.
        globPatterns: ["**/*.{js,css,html}"],
      },
    }),
  ],
});

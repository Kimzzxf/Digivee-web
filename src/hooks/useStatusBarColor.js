import { useEffect } from "react";

const COLORS = { pink: "#FF8DA1", ink: "#3A4032" };
const DEFAULT = "#F4EAE1"; // paper — whatever's under the status bar when no band claims it

// Runs once for the whole app (mounted in App.jsx). Keeps the status-bar
// patch (body::before, see index.css) in sync with whichever [data-status-color]
// band currently touches the very top of the viewport, instead of a color
// hardcoded to the hero's pink.
export function useStatusBarColor(routeKey) {
  useEffect(() => {
    function sync() {
      const bands = document.querySelectorAll("[data-status-color]");
      let color = DEFAULT;
      for (const el of bands) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 0 && rect.bottom > 0) {
          color = COLORS[el.dataset.statusColor] ?? DEFAULT;
          break;
        }
      }
      document.documentElement.style.setProperty("--status-bar-color", color);
    }

    sync(); // sync on mount/route change — page can load already scrolled
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, [routeKey]);
}

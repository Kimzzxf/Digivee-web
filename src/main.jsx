import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { NotificationProvider } from "./components/NotificationProvider";
import { initLenis } from "./lib/lenis";
import "./index.css";

initLenis();

// Registering here (not just inside enablePushNotifications in lib/push.js)
// means every visitor gets a registered service worker on first load, which
// Chrome/Android require before they'll fire `beforeinstallprompt` — so the
// install prompt works for regular customers, not only after an admin opts
// into push notifications. Doesn't request any permissions by itself.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Best-effort — a failed registration just means no install prompt /
      // push this session, nothing in the app depends on it synchronously.
    });
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </BrowserRouter>
  </React.StrictMode>
);

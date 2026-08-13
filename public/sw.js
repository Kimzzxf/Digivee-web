// Push notifications for /admin ("order baru masuk"). Vite serves anything
// in public/ from the site root, so this lands at /sw.js — required,
// since a service worker's scope is everything at/under its own URL path.
// Registered from src/lib/push.js.

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    // Payload wasn't JSON (shouldn't happen — utils/webpush.js always
    // sends JSON.stringify'd payload) — fall back to defaults below.
  }

  const title = data.title || "Digivee";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/badge-96.png",
    tag: "digivee-order", // collapses multiple pending pushes into one notification instead of stacking
    renotify: true,
    data: { url: data.url || "/admin" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Clicking the notification focuses an already-open /admin tab if there
// is one, otherwise opens a new one — instead of just closing silently.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/admin";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

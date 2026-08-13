import { api } from "./api";

// Public VAPID key — safe to ship in client JS (it's the whole point of
// VAPID: only the matching VAPID_PRIVATE_KEY, which never leaves the
// server, can actually sign pushes). Vite only bundles VITE_-prefixed env
// vars into client code, hence the separate name from the server's
// VAPID_PUBLIC_KEY in .env.example even though the value is identical.
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

// pushManager.subscribe() needs the VAPID public key as a raw Uint8Array,
// not the base64url string the env var holds.
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function pushSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
}

// iOS Safari has both APIs above even in a regular browser tab, but
// pushManager.subscribe() only actually works once the site is running
// as a Home Screen app (Apple's requirement, not a bug on our end) — so
// pushSupported() alone isn't enough signal on iPhone.
export function isIos() {
  return typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // Legacy iOS Safari flag — matchMedia above doesn't cover iOS < 16.4
    // reliably, this is the belt-and-suspenders check Apple's own docs use.
    window.navigator.standalone === true
  );
}

/** Current subscription for this browser, or null if never enabled here. */
export async function getPushSubscription() {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration("/sw.js");
  if (!reg) return null;
  return reg.pushManager.getSubscription();
}

/** Registers the service worker, asks for OS notification permission, and
 * saves the resulting subscription server-side so this device starts
 * getting pushes. `target` picks which endpoint/session it registers
 * under — defaults to the admin "order baru masuk" pushes (unchanged
 * behavior for existing callers); pass the customer variant to instead
 * subscribe this device for that customer's own reminders. Throws with a
 * Bahasa message on any failure — callers show it via the existing toast
 * notification system. */
export async function enablePushNotifications(target = { subscribeUrl: "/admin/push/subscribe", authOpts: { admin: true } }) {
  if (!pushSupported()) {
    throw new Error("Browser ini nggak dukung notifikasi push.");
  }
  if (isIos() && !isStandalone()) {
    throw new Error(
      "Di iPhone, notifikasi cuma bisa diaktifin kalau Digivee udah ditambahin ke Home Screen: tombol Share (kotak dengan panah ke atas) → \"Add to Home Screen\". Habis itu buka Digivee dari icon di Home Screen (bukan dari Safari), baru tombol ini bisa dipencet."
    );
  }
  if (!VAPID_PUBLIC_KEY) {
    throw new Error("VITE_VAPID_PUBLIC_KEY belum diisi — cek .env.");
  }

  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Izin notifikasi ditolak. Aktifkan lewat setting browser kalau berubah pikiran.");
  }

  const existing = await reg.pushManager.getSubscription();
  const sub =
    existing ||
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    }));

  const json = sub.toJSON();
  await api.post(target.subscribeUrl, { endpoint: json.endpoint, keys: json.keys }, target.authOpts);
  return sub;
}

/** Best-effort: tells the server to stop pushing to this device, then
 * unsubscribes locally. Swallows errors — "turn off notifications" should
 * never get stuck because of a flaky network request. */
export async function disablePushNotifications(target = { unsubscribeUrl: "/admin/push/unsubscribe", authOpts: { admin: true } }) {
  const sub = await getPushSubscription();
  if (!sub) return;
  await api.post(target.unsubscribeUrl, { endpoint: sub.endpoint }, target.authOpts).catch(() => {});
  await sub.unsubscribe().catch(() => {});
}

/** Same two functions above, pre-wired to this customer's own
 * subscribe/unsubscribe routes (routes/customerPush.js) instead of admin's
 * — used from /profile so a customer can turn on their own return/H-1
 * reminders. */
export const customerPushTarget = (customerId) => ({
  subscribeUrl: `/customers/${customerId}/push/subscribe`,
  unsubscribeUrl: `/customers/${customerId}/push/unsubscribe`,
  authOpts: { customer: true },
});

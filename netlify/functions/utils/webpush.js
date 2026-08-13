import webpush from "web-push";
import PushSubscription from "../models/PushSubscription.js";

function formatRupiah(n) {
  return `Rp${Number(n || 0).toLocaleString("id-ID")}`;
}

let vapidConfigured = false;
function ensureVapid() {
  if (vapidConfigured) return true;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    // Not configured yet — stay silent, same "optional infra" stance the
    // old Telegram notifier had. A booking must still succeed even if
    // push isn't set up.
    return false;
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

// Best-effort by design, same contract as the Telegram notifier it
// replaces: never throws. A booking must still succeed even if every
// subscribed device's subscription is stale or push is down. Fans out to
// every doc `query` matches — a device whose subscription has expired
// (410/404 from the push service) gets its doc deleted here so it stops
// being retried on every future event. Shared by every notify* below
// (admin and customer alike) — only `query` and the payload differ per
// call site.
async function sendPush(query, payload) {
  if (!ensureVapid()) return;

  let subs;
  try {
    subs = await PushSubscription.find(query);
  } catch (err) {
    console.error("Push notify: gagal ambil daftar subscription:", err);
    return;
  }
  if (!subs.length) return;

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } },
          payload
        );
      } catch (err) {
        // 404/410 = the push service (browser vendor) confirms this
        // subscription is dead (device unsubscribed, site data cleared,
        // etc.) — clean it up so we're not calling out to a dead endpoint
        // on every single event from now on. Any other error (network
        // blip, VAPID misconfig) just gets logged, subscription stays.
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: sub._id }).catch(() => {});
        } else {
          console.error(`Push notify gagal (endpoint ${sub.endpoint.slice(0, 60)}...):`, err?.statusCode || err);
        }
      }
    })
  );
}

// customerId: null on the query = admin devices only, so a customer's own
// device (registered via /customers/:id/push/subscribe below) never gets
// an admin-only "order baru masuk" push meant for the shop, and vice versa.
const sendPushToAllAdmins = (payload) => sendPush({ customerId: null }, payload);
const sendPushToCustomer = (customerId, payload) => sendPush({ customerId }, payload);

export async function notifyAdminNewOrderPush({ customer, transaction, meetPoint, duration }) {
  const bodyLines = [
    `${customer.nama} · ${meetPoint?.label || transaction.zona}`,
    duration?.label ? `${duration.label} · ${formatRupiah(transaction.biaya)}` : formatRupiah(transaction.biaya),
    `Pickup ${transaction.tanggalSewa} ${transaction.jamPickup}`,
  ];
  const payload = JSON.stringify({
    title: "🟡 Order baru masuk!",
    body: bodyLines.join("\n"),
    url: "/admin",
  });
  await sendPushToAllAdmins(payload);
}

// Push counterpart to notifyAdminReturnReminder (telegram.js) — same
// "admin relays to customer via WA" reasoning, see comment there.
export async function notifyAdminReturnReminderPush({ customer, transaction }) {
  const payload = JSON.stringify({
    title: "🔔 Reminder balik — 3 jam lagi",
    body: `${customer.nama} · ${customer.telp}`,
    url: "/admin",
  });
  await sendPushToAllAdmins(payload);
}

// Push counterpart to notifyAdminH1Reminder (telegram.js).
export async function notifyAdminH1ReminderPush({ customer, transaction }) {
  const payload = JSON.stringify({
    title: "🔔 Reminder H-1 — booking besok",
    body: `${customer.nama} · ${customer.telp}`,
    url: "/admin",
  });
  await sendPushToAllAdmins(payload);
}

// Push counterpart to notifyAdminNewCustomer (telegram.js) — same
// "instant event" shape as notifyAdminNewOrderPush above.
export async function notifyAdminNewCustomerPush({ customer }) {
  const payload = JSON.stringify({
    title: "🆕 Customer baru daftar",
    body: `${customer.nama} · ${customer.telp}`,
    url: "/admin",
  });
  await sendPushToAllAdmins(payload);
}

// Sent straight to the customer's own device (if they've enabled push from
// /profile) — they're the one who actually needs to act on this, admin
// getting notifyAdminReturnReminderPush is a separate, best-effort heads up
// so admin can nudge over WA too if the customer misses it.
export async function notifyCustomerReturnReminderPush({ customer, transaction }) {
  const payload = JSON.stringify({
    title: "🔔 Waktunya balikin kamera — 3 jam lagi",
    body: `Jangan lupa balikin sebelum ${transaction.jamKembali} ya, ${customer.nama}.`,
    url: "/profile",
  });
  await sendPushToCustomer(customer._id, payload);
}

// Customer counterpart to notifyAdminH1ReminderPush — reminds the customer
// their own booking is tomorrow, same trigger window as the admin version.
export async function notifyCustomerH1ReminderPush({ customer, transaction }) {
  const payload = JSON.stringify({
    title: "📸 Sewa kamu besok!",
    body: `Jangan lupa pickup jam ${transaction.jamPickup} ya, ${customer.nama}.`,
    url: "/profile",
  });
  await sendPushToCustomer(customer._id, payload);
}

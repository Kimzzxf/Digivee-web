// Sends a "order baru masuk" push to admin's phone via the Telegram Bot
// API's sendMessage endpoint. Picked over WhatsApp Cloud API / a WA
// gateway because there's no business-verification or message-template
// approval step — once TELEGRAM_ADMIN_CHAT_ID has sent /start to the bot
// once, sendMessage just works, and Telegram's app delivers it as a
// normal push notification on the admin's phone.
//
// Best-effort by design: notifyAdminNewOrder() never throws. A booking
// must still succeed even if Telegram is down, misconfigured, or not set
// up yet — see the call site in api.js, which doesn't let this block or
// fail the response.
const TELEGRAM_API_BASE = "https://api.telegram.org";

function formatRupiah(n) {
  return `Rp${Number(n || 0).toLocaleString("id-ID")}`;
}

// Shared fan-out, extracted so notifyAdminNewOrder and
// notifyAdminReturnReminder don't duplicate the "loop every configured
// admin chat id, best-effort" plumbing — only the message text differs.
async function sendTelegramToAdmins(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatIdsRaw = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatIdsRaw) {
    // Not configured yet — stay silent so Telegram remains optional infra,
    // never a hard requirement to take bookings.
    return;
  }

  const chatIds = chatIdsRaw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  await Promise.all(
    chatIds.map(async (chatId) => {
      try {
        const res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text }),
        });
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          console.error(`Telegram notify gagal (chat_id ${chatId}):`, res.status, body);
        }
      } catch (err) {
        console.error(`Telegram notify error (chat_id ${chatId}):`, err);
      }
    })
  );
}

export async function notifyAdminNewOrder({ customer, transaction, meetPoint, duration }) {
  const lines = [
    "🟡 Order baru masuk!",
    "",
    `Nama: ${customer.nama}`,
    `WA: ${customer.telp}`,
    `Meet point: ${meetPoint?.label || transaction.zona}`,
    duration?.label ? `Durasi: ${duration.label}` : null,
    `Pickup: ${transaction.tanggalSewa} ${transaction.jamPickup}`,
    `Return: ${transaction.tanggalKembali} ${transaction.jamKembali}`,
    `Biaya: ${formatRupiah(transaction.biaya)}`,
    transaction.diskonAlasan && transaction.diskonAlasan !== "none"
      ? `Diskon: ${transaction.diskonAlasan} (-${formatRupiah(transaction.diskon)})`
      : null,
  ].filter(Boolean);
  await sendTelegramToAdmins(lines.join("\n"));
}

// Fired by the scheduled reminder-check (see
// netlify/functions/reminder-check.js) 3 jam sebelum jam kembali —
// dikirim ke ADMIN (bukan customer): satu-satunya kanal ke customer yang
// ada sekarang cuma WA link yang customer klik sendiri, gak bisa
// dipush server-side tanpa WA Business API. Admin yang tinggal WA
// customer-nya, nomornya udah ada di pesan ini.
export async function notifyAdminReturnReminder({ customer, transaction }) {
  const lines = [
    "🔔 Reminder balik — 3 jam lagi",
    "",
    `Nama: ${customer.nama}`,
    `WA: ${customer.telp}`,
    `Target kembali: ${transaction.tanggalKembali?.toISOString?.().slice(0, 10) || transaction.tanggalKembali} ${transaction.jamKembali} WIB`,
  ];
  await sendTelegramToAdmins(lines.join("\n"));
}

// Fired by the scheduled reminder-check begitu sebuah transaksi "Booked"
// masuk H-1 tanggal sewa (24 jam sebelum pickup) — dikirim ke ADMIN sama
// kayak notifyAdminReturnReminder, biar admin inget follow up DP/persiapan
// sebelum hari-H. Tombol "Follow Up" WA yang beneran ngirim ke customer
// tetap manual (klik admin) — lihat alasan di komentar atas file ini.
export async function notifyAdminH1Reminder({ customer, transaction }) {
  const lines = [
    "🔔 Reminder H-1 — booking besok",
    "",
    `Nama: ${customer.nama}`,
    `WA: ${customer.telp}`,
    `Tgl sewa: ${transaction.tanggalSewa?.toISOString?.().slice(0, 10) || transaction.tanggalSewa} ${transaction.jamPickup || ""} WIB`,
  ];
  await sendTelegramToAdmins(lines.join("\n"));
}

// Fired right after a customer finishes registering (customerAuthEntry.js)
// — same "instant event, notify admin" shape as notifyAdminNewOrder above,
// separate function because the message content is unrelated to orders.
export async function notifyAdminNewCustomer({ customer }) {
  const lines = ["🆕 Customer baru daftar", "", `Nama: ${customer.nama}`, `WA: ${customer.telp}`];
  await sendTelegramToAdmins(lines.join("\n"));
}

// Sends the nightly DB dump (see ../db-backup.js) as a Telegram document —
// same bot/chat already wired up above, no new secret or service. Telegram
// caps uploads at 50MB, nowhere near what this shop's data reaches.
// Unlike sendTelegramToAdmins this reports success/failure back to the
// caller instead of swallowing it: a notification that never arrives is a
// missed FYI, a backup that never arrives is data loss, so db-backup.js
// needs to know and log it loudly.
export async function sendTelegramBackup(filename, jsonText) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatIdsRaw = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatIdsRaw) return false;

  const chatIds = chatIdsRaw.split(",").map((id) => id.trim()).filter(Boolean);
  let allOk = true;

  await Promise.all(
    chatIds.map(async (chatId) => {
      const form = new FormData();
      form.append("chat_id", chatId);
      form.append("caption", filename);
      form.append("document", new Blob([jsonText], { type: "application/json" }), filename);
      try {
        const res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendDocument`, { method: "POST", body: form });
        if (!res.ok) {
          allOk = false;
          const body = await res.text().catch(() => "");
          console.error(`Telegram backup gagal (chat_id ${chatId}):`, res.status, body);
        }
      } catch (err) {
        allOk = false;
        console.error(`Telegram backup error (chat_id ${chatId}):`, err);
      }
    })
  );
  return allOk;
}

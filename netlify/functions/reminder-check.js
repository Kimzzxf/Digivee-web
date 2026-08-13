// Netlify scheduled function (see netlify.toml — runs every 15 min).
// Native platform cron, no extra dependency: just a normal handler that
// Netlify invokes on a schedule instead of over HTTP.
//
// Only "Ongoing" rentals matter here — that's the same status
// ReturnCountdown (Admin panel) already treats as "camera's out with
// someone". Fires once per transaction (reminderSent flag) once the
// deadline is within 5h away, latest cutoff 3h away — a transaction
// already inside 3h (or past due) by the time this runs (e.g. duration
// under 5h) just gets skipped, not a late reminder.
import { connectDB } from "./utils/db.js";
import Transaction from "./models/Transaction.js";
import Customer from "./models/Customer.js";
import { combineDateTime } from "../../src/lib/time.js";
import { notifyAdminReturnReminder, notifyAdminH1Reminder } from "./utils/telegram.js";
import {
  notifyAdminReturnReminderPush,
  notifyAdminH1ReminderPush,
  notifyCustomerReturnReminderPush,
  notifyCustomerH1ReminderPush,
} from "./utils/webpush.js";

const REMINDER_WINDOW_MAX_MS = 5 * 60 * 60 * 1000; // earliest: 5h before
const REMINDER_WINDOW_MIN_MS = 3 * 60 * 60 * 1000; // latest cutoff: 3h before
// H-1 reminder only looks 3 days back — guards against notifying on every
// stale/legacy "Booked" row the moment this flag ships, instead of just
// the ones actually approaching pickup.
const H1_STALE_CUTOFF_MS = 3 * 24 * 60 * 60 * 1000;

export const handler = async () => {
  await connectDB();

  const now = Date.now();
  let sent = 0;

  const returnCandidates = await Transaction.find({
    status: "Ongoing",
    reminderSent: { $ne: true },
    tanggalKembali: { $ne: null },
  }).populate("customerId", "nama telp");

  for (const tx of returnCandidates) {
    const deadline = combineDateTime(tx.tanggalKembali.toISOString().slice(0, 10), tx.jamKembali);
    if (!deadline) continue;
    const msLeft = deadline.getTime() - now;
    if (msLeft < REMINDER_WINDOW_MIN_MS || msLeft > REMINDER_WINDOW_MAX_MS) continue;

    const customer = tx.customerId?.nama ? tx.customerId : null;
    if (!customer) continue;

    await Promise.all([
      notifyAdminReturnReminder({ customer, transaction: tx }),
      notifyAdminReturnReminderPush({ customer, transaction: tx }),
      notifyCustomerReturnReminderPush({ customer, transaction: tx }),
    ]);
    tx.reminderSent = true;
    await tx.save();
    sent++;
  }

  // H-1 reminder: sebuah "Booked" row masuk jendela ini begitu sekarang
  // udah lewat (tanggal sewa - 1 hari, 00:00) — sama waktu countdown di
  // Admin panel (BookedCountdown, shared.jsx) abis dan tombol Follow Up
  // muncul, admin juga dapet notif di sini biar gak ketinggalan buka app.
  const h1Candidates = await Transaction.find({
    status: "Booked",
    h1ReminderSent: { $ne: true },
    tanggalSewa: { $ne: null },
  }).populate("customerId", "nama telp");

  for (const tx of h1Candidates) {
    const sewaDate = combineDateTime(tx.tanggalSewa.toISOString().slice(0, 10), "00:00");
    if (!sewaDate) continue;
    const target = sewaDate.getTime() - 24 * 60 * 60 * 1000;
    const msPast = now - target;
    if (msPast < 0 || msPast > H1_STALE_CUTOFF_MS) continue;

    const customer = tx.customerId?.nama ? tx.customerId : null;
    if (!customer) continue;

    await Promise.all([
      notifyAdminH1Reminder({ customer, transaction: tx }),
      notifyAdminH1ReminderPush({ customer, transaction: tx }),
      notifyCustomerH1ReminderPush({ customer, transaction: tx }),
    ]);
    tx.h1ReminderSent = true;
    await tx.save();
    sent++;
  }

  return { statusCode: 200, body: JSON.stringify({ checkedReturn: returnCandidates.length, checkedH1: h1Candidates.length, sent }) };
};

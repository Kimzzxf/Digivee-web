// Netlify scheduled function (see netlify.toml — runs daily). Same native-
// cron pattern as reminder-check.js: a plain handler Netlify invokes on a
// schedule instead of over HTTP, no extra dependency.
//
// Why Telegram and not MongoDB Atlas Cloud Backup: Atlas's built-in
// continuous backup only exists on M10+ paid clusters — check your cluster
// tier at cloud.mongodb.com; if it's already M10+, turn that on instead and
// this function is redundant belt-and-suspenders at worst. On the free M0
// tier (no built-in backup), this is the actual replacement.
//
// Why not upload to S3/GCS instead: that needs a new dependency AND a new
// secret. The Telegram bot/chat id already set up for admin notifications
// (utils/telegram.js) can carry a file just as well — reusing it means
// this ships with zero new secrets.
//
// Only Customer + Transaction get dumped — everything else in models/
// (AdminLoginAttempt, IpLoginAttempt, PushSubscription) is regenerable
// session/rate-limit bookkeeping, not data worth restoring.
import { connectDB } from "./utils/db.js";
import Customer from "./models/Customer.js";
import Transaction from "./models/Transaction.js";
import { sendTelegramBackup } from "./utils/telegram.js";

export const handler = async () => {
  await connectDB();

  const [customers, transactions] = await Promise.all([Customer.find().lean(), Transaction.find().lean()]);

  const dump = { exportedAt: new Date().toISOString(), customers, transactions };
  const filename = `digivee-backup-${new Date().toISOString().slice(0, 10)}.json`;

  const sent = await sendTelegramBackup(filename, JSON.stringify(dump));
  // ponytail: no retry/queue on failure, just log loud — a silently
  // broken backup cron is worse than a noisy one. Add a retry if this
  // ever actually flakes in practice.
  if (!sent) {
    console.error("Backup gagal terkirim ke Telegram — cek TELEGRAM_BOT_TOKEN/TELEGRAM_ADMIN_CHAT_ID.");
  }

  return {
    statusCode: sent ? 200 : 500,
    body: JSON.stringify({ customers: customers.length, transactions: transactions.length, sent }),
  };
};

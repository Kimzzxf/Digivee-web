import crypto from "crypto";

// Every unexpected error used to go straight out as `err.message` — that
// leaks internal details (Mongo/Mongoose error text, field names, sometimes
// bits of a query) to whoever's poking the API. Log the real error server-
// side, tell the client something generic instead.
export function fail(res, err) {
  console.error(err);
  res.status(500).json({ error: "Terjadi kesalahan pada server. Coba lagi nanti." });
}

// User-supplied text going into a Mongo $regex must be escaped, or someone
// searching /admin/customers?q=... can inject regex syntax — at best that
// breaks the search, at worst a crafted pattern (catastrophic backtracking)
// hangs the function.
export function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Which statuses count as a "real" transaction for loyalty/eligibility
// purposes — i.e. the rental actually finished. "Ongoing" is deliberately
// left out: points/promo eligibility only credit once admin flips a
// transaction to Completed (by hand or via the Laporan QR-scan flow), not
// the moment the camera goes out the door. "Pending", "Booked", and
// "Cancelled" don't count either. Used everywhere `transaction_count` is
// computed for eligibility/display. Deliberately NOT used for the DELETE
// /admin/customers/:id guard or the merge's document move, which need to
// catch ALL transaction docs (any status).
export const REAL_TX_STATUSES = ["Completed"];

// Plain `!==` on the admin PIN leaks timing info (string comparison bails
// out at the first mismatched character). Hash both sides to a fixed length
// first, then compare with timingSafeEqual so the comparison time doesn't
// depend on how many leading digits were right.
export function safeEqual(a, b) {
  const ah = crypto.createHash("sha256").update(String(a)).digest();
  const bh = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ah, bh);
}

export const PIN_MAX_ATTEMPTS = 5;
export const PIN_LOCK_MINUTES = 15;
export const ADMIN_PIN_MAX_ATTEMPTS = 5;
export const ADMIN_PIN_LOCK_MINUTES = 30;
// Higher than the per-account limits on purpose — one IP (office wifi,
// warnet, campus NAT) can be many different legit customers, so this
// should only trip on genuine hammering across accounts, not a couple of
// people fat-fingering their own PIN behind the same router.
export const IP_MAX_ATTEMPTS = 15;
export const IP_LOCK_MINUTES = 30;

// Netlify terminates TLS and proxies the request, so req.socket.remoteAddress
// is Netlify's own edge, not the caller — the real client IP only shows up
// in headers. x-nf-client-connection-ip is Netlify's own (most reliable);
// x-forwarded-for is the generic fallback and can be a comma list if the
// request passed through more than one proxy, so take the first hop.
export function getClientIp(req) {
  const xff = req.headers["x-nf-client-connection-ip"] || req.headers["x-forwarded-for"];
  if (xff) return String(xff).split(",")[0].trim();
  return req.ip || req.socket?.remoteAddress || "unknown";
}

export function normalizePhone(raw) {
  return String(raw || "")
    .replace(/[^0-9]/g, "")
    .replace(/^0/, "62");
}

export function isValidPin(pin) {
  return /^\d{6}$/.test(String(pin ?? ""));
}

export function adminAllowedPhones() {
  return (process.env.ADMIN_ALLOWED_PHONES || "")
    .split(",")
    .map((p) => normalizePhone(p))
    .filter(Boolean);
}

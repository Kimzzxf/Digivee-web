// Single source of truth for the transaction status lifecycle, shared by
// the admin Laporan/Catat Transaksi dropdowns (Admin.jsx) and the customer
// Profile page (Profile.jsx) — so admin and customer always see the same
// set of statuses, in the same order, with the same meaning attached.
//
// Lifecycle: Pending -> Booked -> Ongoing -> Completed, with Cancelled
// reachable from any of them.
//   Pending   - customer submitted the form & got sent to WA, nothing
//               confirmed yet (no proof of payment).
//   Booked    - admin confirmed proof of payment (DP) came in on WA, but
//               pickup day hasn't happened yet.
//   Ongoing   - customer has picked up the camera, rental in progress.
//   Completed - camera returned, rental finished.
//   Cancelled - didn't go through.
export const STATUS_ORDER = ["Pending", "Booked", "Ongoing", "Completed", "Cancelled"];

export const STATUS_LABEL = {
  Pending: "Pending",
  Booked: "Booked",
  Ongoing: "Ongoing",
  Completed: "Completed",
  Cancelled: "Cancelled",
};

// Tailwind classes for the small pill/badge used to show a transaction's
// status. Booked sits visually between Pending (flat sand) and Completed
// (solid pink) — a pink outline signals "confirmed" without yet being the
// solid-fill "done" look Completed gets.
export const STATUS_STYLE = {
  Pending: "bg-sand text-ink",
  Booked: "bg-pink/20 text-ink border border-pink/60",
  Ongoing: "bg-ink text-paper",
  Completed: "bg-pink text-ink",
  Cancelled: "bg-transparent text-ink/40 border border-ink/20",
};

// Suggested payment % the moment admin flips a transaction to this status
// — Pending has no DP yet, Booked means DP (50%) came in, Ongoing/Completed
// mean fully paid. Cancelled defaults to 0 but is NOT a hard rule: a booking
// can get cancelled unilaterally *after* DP was already paid in, so admin
// can still type any number over top of the suggestion.
export const DEFAULT_PAYMENT_PERCENT = {
  Pending: 0,
  Booked: 50,
  Ongoing: 100,
  Completed: 100,
  Cancelled: 0,
};

// { status, payment_percent } patch to spread into a transaction form's
// `set()` on status change — one function so Catat Transaksi and Edit
// Transaksi can't drift out of sync on what each status defaults to.
export function statusChangePatch(status) {
  return { status, payment_percent: String(DEFAULT_PAYMENT_PERCENT[status] ?? 100) };
}

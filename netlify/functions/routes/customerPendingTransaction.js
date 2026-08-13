import express from "express";
import { requireSelf } from "../utils/customerAuth.js";
import { serializeTransaction } from "../utils/serialize.js";
import Customer from "../models/Customer.js";
import Transaction from "../models/Transaction.js";
// Same source of truth Sewa.jsx and Admin.jsx use for price list + promo
// eligibility — imported here (not duplicated) so this route can
// independently recompute the price and which promo (if any) applies,
// instead of trusting whatever a customer's browser sends. Plain JS, no
// Vite/React-only APIs, so it's safe to pull straight into the serverless
// bundle.
import { getMeetPoint, getDuration } from "../../../src/lib/pricelist.js";
import { addMinutesToDateTime } from "../../../src/lib/time.js";
import { notifyAdminNewOrderPush } from "../utils/webpush.js";
import { fail, REAL_TX_STATUSES } from "../utils/apiHelpers.js";
import { computePendingTxPromo } from "../utils/promoEligibility.js";
import { DEFAULT_PAYMENT_PERCENT } from "../../../src/lib/status.js";

const router = express.Router();

// Called by Sewa.jsx right when the customer hits "Lanjutkan ke
// Pembayaran", BEFORE they're handed off to WA — saves a "Pending"
// transaction with the same numbers that go into the WA message, so admin
// doesn't have to re-type the whole booking into "Catat Transaksi" after
// confirming on chat. They just find this row (status Pending) and flip it
// to Completed.
//
// Price and promo eligibility (referral/loyalty) are recomputed here from
// the meet point/duration price list and the customer's own DB counters —
// never trusted from the request body (see computePendingTxPromo).
router.post("/customers/:id/transactions/pending", requireSelf, async (req, res) => {
  try {
    const b = req.body || {};
    const meetPoint = getMeetPoint(b.meet_point_id);
    const duration = meetPoint ? getDuration(b.meet_point_id, b.duration_id) : null;
    if (!meetPoint || !duration) {
      return res.status(400).json({ error: "Meet point / durasi nggak valid." });
    }

    const alamat = typeof b.alamat === "string" && b.alamat.trim() ? b.alamat.trim() : null;
    const tanggalSewa = b.tanggal_sewa || null;
    const jamPickup = b.jam_pickup || null;
    let tanggalKembali = b.tanggal_kembali || null;
    let jamKembali = b.jam_kembali || null;
    if (!tanggalSewa || !jamPickup || !tanggalKembali || !jamKembali) {
      return res.status(400).json({ error: "Tanggal/jam pickup & return wajib diisi." });
    }
    if (tanggalKembali < tanggalSewa || (tanggalKembali === tanggalSewa && jamKembali < jamPickup)) {
      return res.status(400).json({ error: "Tanggal/jam return nggak boleh sebelum pickup." });
    }

    // Same check the calendar on Sewa.jsx uses to grey out dates client-side —
    // repeated here because that's only UI, this is the actual trust
    // boundary (a request hitting this route directly skips the calendar
    // entirely). Inclusive overlap: two ranges collide if each one starts
    // on or before the other ends. Must match availability.js's status set
    // (Booked = DP confirmed, Ongoing = camera's literally out) — this was
    // only checking "Booked", so a double-booking against an Ongoing rental
    // could slip past the one real trust boundary even though the calendar
    // UI already greys those same dates out.
    const overlap = await Transaction.exists({
      status: { $in: ["Booked", "Ongoing"] },
      tanggalSewa: { $lte: tanggalKembali },
      tanggalKembali: { $gte: tanggalSewa },
    });
    if (overlap) {
      return res.status(400).json({ error: "Tanggal itu udah dibooking. Coba tanggal lain." });
    }

    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ error: "Customer tidak ditemukan." });

    const zona = meetPoint.id.replace("zona", "");
    const jumlah = duration.price;
    const transactionCount = await Transaction.countDocuments({
      customerId: customer._id,
      status: { $in: REAL_TX_STATUSES },
    });

    const { diskonAlasan, diskon, bonusMenit } = computePendingTxPromo({
      customer,
      zona,
      jumlah,
      transactionCount,
      loyaltyChoice: b.loyalty_choice,
      durationMinutes: duration.minutes,
    });

    if (bonusMenit > 0) {
      const bumped = addMinutesToDateTime(tanggalKembali, jamKembali, bonusMenit);
      if (bumped) {
        tanggalKembali = bumped.date;
        jamKembali = bumped.time;
      }
    }

    // Side effects (referralDiscountUsed, referralCreditsAvailable,
    // loyaltyCyclesRedeemed) intentionally do NOT run here — nothing's
    // confirmed yet. They only fire once, in PATCH /admin/transactions/:id,
    // the first time this row actually gets marked Completed.
    const doc = await Transaction.create({
      customerId: customer._id,
      zona,
      // Dari hint pas milih Meet Point di Sewa.jsx (sama endpoint
      // /geocode-distance yang dipanggil di sana, sekarang dikasih titik
      // meet point bukan alamat) — dipercaya sebatas buat catatan HPP
      // internal, bukan buat biaya/promo (yang tetep dihitung ulang di
      // atas dari price list, gak pernah dari body request).
      jarakKm: b.jarak_km != null && Number.isFinite(Number(b.jarak_km)) ? Number(b.jarak_km) : null,
      alamat,
      titikMeetPoint: typeof b.titik_meet_point === "string" && b.titik_meet_point.trim() ? b.titik_meet_point.trim() : null,
      tanggalSewa,
      tanggalKembali,
      jamPickup,
      jamKembali,
      biaya: jumlah - diskon,
      denda: 0,
      paymentPercent: DEFAULT_PAYMENT_PERCENT.Pending,
      status: "Pending",
      diskon,
      diskonAlasan,
    });

    // Fire-and-forget-but-awaited: we still wait for it so it actually
    // runs before this function's response ends (serverless can freeze
    // the process right after res.json()), but any failure only gets
    // logged inside notifyAdminNewOrderPush — it never reaches this catch
    // block, so a push-service outage (or no admin device subscribed yet)
    // can't turn a successful booking into an error response.
    await notifyAdminNewOrderPush({ customer, transaction: doc, meetPoint, duration });

    res.json(serializeTransaction(doc));
  } catch (err) {
    fail(res, err);
  }
});

export default router;

import express from "express";
import { requireAdmin } from "../utils/adminAuth.js";
import { serializeTransaction } from "../utils/serialize.js";
import Transaction from "../models/Transaction.js";
import Customer from "../models/Customer.js";
import { fail } from "../utils/apiHelpers.js";
import { applyPromoSideEffects } from "../utils/promoEligibility.js";
import { defaultChecklist } from "../../../src/lib/checklist.js";

const router = express.Router();

router.post("/admin/transactions", requireAdmin, async (req, res) => {
  try {
    const b = req.body || {};
    const diskonAlasan = ["referral_baru", "referral_kredit", "loyalty"].includes(b.diskon_alasan)
      ? b.diskon_alasan
      : "none";
    const dendaAlasan = ["telat", "rusak", "hilang"].includes(b.denda_alasan) ? b.denda_alasan : "none";
    const paymentPercent = Number(b.payment_percent);
    const doc = await Transaction.create({
      customerId: b.customer_id,
      zona: b.zona,
      jarakKm: b.jarak_km != null && Number.isFinite(Number(b.jarak_km)) ? Number(b.jarak_km) : null,
      alamat: b.alamat || null,
      titikMeetPoint: b.titik_meet_point || null,
      kota: b.kota || null,
      tanggalSewa: b.tanggal_sewa || null,
      tanggalKembali: b.tanggal_kembali || null,
      jamPickup: b.jam_pickup || null,
      jamKembali: b.jam_kembali || null,
      biaya: Number(b.biaya) || 0,
      denda: Number(b.denda) || 0,
      paymentPercent: Number.isFinite(paymentPercent) ? paymentPercent : 100,
      status: b.status || "Completed",
      diskon: Number(b.diskon) || 0,
      diskonAlasan,
      dendaAlasan,
      checklist: defaultChecklist(),
      // Applied unconditionally below (this route always fires the side
      // effects immediately, regardless of chosen status) — recorded so a
      // later PATCH that edits this row's status never re-applies them.
      diskonApplied: diskonAlasan !== "none",
    });

    // Tandain sisi mana dari promo yang barusan kepakai, biar ga bisa
    // diklaim ulang di transaksi berikutnya.
    await applyPromoSideEffects(Customer, b.customer_id, diskonAlasan);

    res.json(serializeTransaction(doc));
  } catch (err) {
    fail(res, err);
  }
});

export default router;

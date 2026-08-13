import express from "express";
import { requireAdmin } from "../utils/adminAuth.js";
import { serializeTransaction } from "../utils/serialize.js";
import Transaction from "../models/Transaction.js";
import Customer from "../models/Customer.js";
import { fail } from "../utils/apiHelpers.js";
import { applyPromoSideEffects } from "../utils/promoEligibility.js";

const router = express.Router();

// update any field on an existing transaction (fixing typos, wrong zona,
// wrong amount, etc.)
router.patch("/admin/transactions/:id", requireAdmin, async (req, res) => {
  try {
    const b = req.body || {};
    const patch = {};
    if (b.zona !== undefined) patch.zona = b.zona;
    if (b.jarak_km !== undefined) {
      patch.jarakKm = b.jarak_km != null && Number.isFinite(Number(b.jarak_km)) ? Number(b.jarak_km) : null;
    }
    if (b.alamat !== undefined) patch.alamat = b.alamat || null;
    if (b.titik_meet_point !== undefined) patch.titikMeetPoint = b.titik_meet_point || null;
    if (b.kota !== undefined) patch.kota = b.kota || null;
    if (b.tanggal_sewa !== undefined) patch.tanggalSewa = b.tanggal_sewa || null;
    if (b.tanggal_kembali !== undefined) patch.tanggalKembali = b.tanggal_kembali || null;
    if (b.jam_pickup !== undefined) patch.jamPickup = b.jam_pickup || null;
    if (b.jam_kembali !== undefined) patch.jamKembali = b.jam_kembali || null;
    if (b.biaya !== undefined) patch.biaya = Number(b.biaya) || 0;
    if (b.denda !== undefined) patch.denda = Number(b.denda) || 0;
    if (b.denda_alasan !== undefined) {
      patch.dendaAlasan = ["telat", "rusak", "hilang"].includes(b.denda_alasan) ? b.denda_alasan : "none";
    }
    if (b.checklist !== undefined) patch.checklist = b.checklist;
    if (b.payment_percent !== undefined) {
      const paymentPercent = Number(b.payment_percent);
      patch.paymentPercent = Number.isFinite(paymentPercent) ? paymentPercent : 100;
    }
    if (b.status !== undefined) patch.status = b.status;
    // Analytics-only override: lets admin correct created_at when a
    // transaction was logged late/backdated, so reports (useAnalytics.js)
    // reflect when the booking actually happened.
    if (b.created_at) {
      const createdAt = new Date(b.created_at);
      if (!Number.isNaN(createdAt.getTime())) patch.createdAt = createdAt;
    }

    // A transaction saved via POST /customers/:id/transactions/pending sits
    // as "Pending" with its diskon/diskonAlasan already computed, but the
    // referral/loyalty side effects on the Customer record are deliberately
    // deferred until admin actually confirms it — right here, the first
    // time it's edited to "Completed". `diskonApplied` keeps this from
    // firing twice if the status later gets edited back and forth.
    if (b.status === "Completed") {
      const existing = await Transaction.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: "Transaksi tidak ditemukan." });
      if (existing.status !== "Completed" && !existing.diskonApplied && existing.diskonAlasan !== "none") {
        await applyPromoSideEffects(Customer, existing.customerId, existing.diskonAlasan);
        patch.diskonApplied = true;
      }
    }

    const doc = await Transaction.findByIdAndUpdate(req.params.id, patch, { new: true }).populate("customerId", "nama telp");
    if (!doc) return res.status(404).json({ error: "Transaksi tidak ditemukan." });
    const customerDoc = doc.customerId && doc.customerId.nama ? doc.customerId : null;
    const plain = doc.toObject();
    plain.customerId = doc.customerId?._id || doc.customerId;
    res.json(serializeTransaction(plain, customerDoc));
  } catch (err) {
    fail(res, err);
  }
});

router.delete("/admin/transactions/:id", requireAdmin, async (req, res) => {
  try {
    const deleted = await Transaction.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Transaksi tidak ditemukan." });
    res.json({ ok: true });
  } catch (err) {
    fail(res, err);
  }
});

router.get("/admin/transactions", requireAdmin, async (req, res) => {
  try {
    const docs = await Transaction.find({}).sort({ tanggalSewa: -1 }).populate("customerId", "nama telp");
    res.json(
      docs.map((d) => {
        const customerDoc = d.customerId && d.customerId.nama ? d.customerId : null;
        // populate() replaces customerId with the doc; serialize needs the raw id.
        const plain = d.toObject();
        plain.customerId = d.customerId?._id || d.customerId;
        return serializeTransaction(plain, customerDoc);
      })
    );
  } catch (err) {
    fail(res, err);
  }
});

export default router;

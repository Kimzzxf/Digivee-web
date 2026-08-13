import express from "express";
import { requireSelf } from "../utils/customerAuth.js";
import { serializeCustomer, serializeTransaction } from "../utils/serialize.js";
import Customer from "../models/Customer.js";
import Transaction from "../models/Transaction.js";
import { fail, normalizePhone, REAL_TX_STATUSES } from "../utils/apiHelpers.js";

const router = express.Router();

// customer editing their own nama/telp from the Profile page — same shape
// as admin's PATCH /admin/customers/:id, minus the merge-on-conflict offer
// (a customer can't merge two accounts themselves, they just get told the
// number's taken).
router.patch("/customers/:id", requireSelf, async (req, res) => {
  try {
    const { nama, telp: telpRaw, alamat } = req.body || {};
    const telp = normalizePhone(telpRaw);
    if (!nama || !String(nama).trim() || telp.length < 9) {
      return res.status(400).json({ error: "Nama dan nomor WhatsApp wajib diisi dengan benar." });
    }
    const conflict = await Customer.findOne({ telp, _id: { $ne: req.params.id } });
    if (conflict) {
      return res.status(409).json({ error: "Nomor WA ini udah dipakai akun lain." });
    }
    const patch = { nama: String(nama).trim(), telp };
    if (alamat !== undefined) patch.alamat = String(alamat).trim() || null;
    const updated = await Customer.findByIdAndUpdate(req.params.id, patch, { new: true });
    if (!updated) return res.status(404).json({ error: "Customer tidak ditemukan." });
    res.json(serializeCustomer(updated));
  } catch (err) {
    fail(res, err);
  }
});

router.get("/customers/:id", requireSelf, async (req, res) => {
  try {
    const doc = await Customer.findById(req.params.id)
      .populate("referredBy", "nama telp")
      .catch(() => null);
    if (!doc) return res.status(404).json({ error: "Customer tidak ditemukan." });
    const [transactionCount, referralCount] = await Promise.all([
      Transaction.countDocuments({ customerId: doc._id, status: { $in: REAL_TX_STATUSES } }),
      // Semua orang yang daftar lewat link ?ref=... customer ini — dipakai
      // di kartu "REFERRAL" Profile.jsx bareng GET /customers/:id/referrals
      // di bawah buat isi tombol Detail-nya.
      Customer.countDocuments({ referredBy: doc._id }),
    ]);
    res.json({
      ...serializeCustomer(doc),
      transaction_count: transactionCount,
      referral_count: referralCount,
    });
  } catch (err) {
    fail(res, err);
  }
});

router.get("/customers/:id/transactions", requireSelf, async (req, res) => {
  try {
    const docs = await Transaction.find({ customerId: req.params.id }).sort({ tanggalSewa: -1 });
    res.json(docs.map((d) => serializeTransaction(d)));
  } catch (err) {
    fail(res, err);
  }
});

// List of customers THIS customer invited (their referredBy points here) —
// powers the "Lihat Detail" button under the referral count in
// Profile.jsx. requireSelf same as the route above: only the account owner
// can pull their own referred-list, not any id someone hands in.
router.get("/customers/:id/referrals", requireSelf, async (req, res) => {
  try {
    const docs = await Customer.find({ referredBy: req.params.id })
      .select("nama telp referralDiscountUsed createdAt")
      .sort({ createdAt: -1 });
    res.json(
      docs.map((d) => ({
        id: d._id.toString(),
        nama: d.nama,
        telp: d.telp,
        // Signed up via the link vs. actually redeemed the referral
        // discount on their first transaction — worth showing both states
        // so the referrer can tell who just registered from who's really
        // "counted" toward their credits.
        referral_discount_used: Boolean(d.referralDiscountUsed),
        created_at: d.createdAt,
      }))
    );
  } catch (err) {
    fail(res, err);
  }
});

export default router;

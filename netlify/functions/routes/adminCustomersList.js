import express from "express";
import { requireAdmin } from "../utils/adminAuth.js";
import { serializeCustomer } from "../utils/serialize.js";
import Customer from "../models/Customer.js";
import Transaction from "../models/Transaction.js";
import {
  fail,
  escapeRegex,
  normalizePhone,
  REAL_TX_STATUSES,
} from "../utils/apiHelpers.js";

const router = express.Router();

router.get(
  "/admin/customers/by-phone/:telp",
  requireAdmin,
  async (req, res) => {
    try {
      const telp = normalizePhone(req.params.telp);
      const doc = await Customer.findOne({ telp }).populate(
        "referredBy",
        "nama telp",
      );
      if (!doc)
        return res
          .status(404)
          .json({
            error:
              "Customer tidak ditemukan. Minta mereka login/daftar dulu di web.",
          });
      const transactionCount = await Transaction.countDocuments({
        customerId: doc._id,
        status: { $in: REAL_TX_STATUSES },
      });
      res.json({
        ...serializeCustomer(doc),
        transaction_count: transactionCount,
      });
    } catch (err) {
      fail(res, err);
    }
  },
);

router.get("/admin/customers/:id", requireAdmin, async (req, res) => {
  try {
    const doc = await Customer.findById(req.params.id).populate(
      "referredBy",
      "nama telp",
    );
    if (!doc)
      return res.status(404).json({ error: "Customer tidak ditemukan." });
    const transactionCount = await Transaction.countDocuments({
      customerId: doc._id,
      status: { $in: REAL_TX_STATUSES },
    });
    res.json({
      ...serializeCustomer(doc),
      transaction_count: transactionCount,
    });
  } catch (err) {
    fail(res, err);
  }
});

router.get("/admin/customers", requireAdmin, async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const filter = q
      ? {
          $or: [
            { nama: { $regex: escapeRegex(q), $options: "i" } },
            {
              telp: {
                $regex: escapeRegex(q.replace(/[^0-9]/g, "")),
                $options: "i",
              },
            },
          ],
        }
      : {};
    const docs = await Customer.find(filter).sort({ createdAt: -1 }).limit(100);
    const counts = await Transaction.aggregate([
      {
        $match: {
          customerId: { $in: docs.map((d) => d._id) },
          status: { $in: REAL_TX_STATUSES },
        },
      },
      { $group: { _id: "$customerId", n: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [c._id.toString(), c.n]));
    res.json(
      docs.map((d) => ({
        ...serializeCustomer(d),
        transaction_count: countMap.get(d._id.toString()) || 0,
        has_pin: Boolean(d.pinHash),
      })),
    );
  } catch (err) {
    fail(res, err);
  }
});

router.patch("/admin/customers/:id", requireAdmin, async (req, res) => {
  try {
    const { nama, telp: telpRaw, created_at, alamat } = req.body || {};
    const telp = normalizePhone(telpRaw);
    if (!nama || !String(nama).trim() || telp.length < 9) {
      return res
        .status(400)
        .json({ error: "Nama dan nomor WhatsApp wajib diisi dengan benar." });
    }

    const conflict = await Customer.findOne({
      telp,
      _id: { $ne: req.params.id },
    });
    if (conflict) {
      const n = await Transaction.countDocuments({
        customerId: conflict._id,
        status: { $in: REAL_TX_STATUSES },
      });
      return res.status(409).json({
        error: `Nomor ini udah dipakai oleh "${conflict.nama}" (${n} transaksi).`,
        conflict: { ...serializeCustomer(conflict), transaction_count: n },
      });
    }

    const patch = { nama: String(nama).trim(), telp };
    if (alamat !== undefined) patch.alamat = String(alamat).trim() || null;
    if (created_at) {
      const createdAt = new Date(created_at);
      if (!Number.isNaN(createdAt.getTime())) patch.createdAt = createdAt;
    }

    const updated = await Customer.findByIdAndUpdate(req.params.id, patch, {
      new: true,
    });
    if (!updated)
      return res.status(404).json({ error: "Customer tidak ditemukan." });
    res.json(serializeCustomer(updated));
  } catch (err) {
    fail(res, err);
  }
});

export default router;

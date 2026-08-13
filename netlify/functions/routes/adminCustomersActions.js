import express from "express";
import { requireAdmin } from "../utils/adminAuth.js";
import { serializeCustomer } from "../utils/serialize.js";
import Customer from "../models/Customer.js";
import Transaction from "../models/Transaction.js";
import { fail, REAL_TX_STATUSES } from "../utils/apiHelpers.js";

const router = express.Router();

router.post("/admin/customers/merge", requireAdmin, async (req, res) => {
  try {
    const { sourceId, targetId } = req.body || {};
    if (!sourceId || !targetId || sourceId === targetId) {
      return res
        .status(400)
        .json({ error: "sourceId dan targetId wajib diisi dan harus beda." });
    }
    const [source, target] = await Promise.all([
      Customer.findById(sourceId),
      Customer.findById(targetId),
    ]);
    if (!source || !target)
      return res
        .status(404)
        .json({ error: "Salah satu customer tidak ditemukan." });

    await Transaction.updateMany(
      { customerId: source._id },
      { customerId: target._id },
    );
    await Customer.deleteOne({ _id: source._id });

    const n = await Transaction.countDocuments({
      customerId: target._id,
      status: { $in: REAL_TX_STATUSES },
    });
    res.json({ ...serializeCustomer(target), transaction_count: n });
  } catch (err) {
    fail(res, err);
  }
});

router.post(
  "/admin/customers/:id/reset-pin",
  requireAdmin,
  async (req, res) => {
    try {
      const doc = await Customer.findByIdAndUpdate(
        req.params.id,
        { pinHash: null, pinFailCount: 0, pinLockedUntil: null },
        { new: true },
      );
      if (!doc)
        return res.status(404).json({ error: "Customer tidak ditemukan." });
      res.json(serializeCustomer(doc));
    } catch (err) {
      fail(res, err);
    }
  },
);

router.delete("/admin/customers/:id", requireAdmin, async (req, res) => {
  try {
    const n = await Transaction.countDocuments({ customerId: req.params.id });
    if (n > 0) {
      return res
        .status(409)
        .json({
          error: `Customer ini masih punya ${n} transaksi. Gabungkan atau hapus transaksinya dulu.`,
        });
    }
    const deleted = await Customer.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ error: "Customer tidak ditemukan." });
    res.json({ ok: true });
  } catch (err) {
    fail(res, err);
  }
});

export default router;

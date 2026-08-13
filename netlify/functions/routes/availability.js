import express from "express";
import Transaction from "../models/Transaction.js";
import { fail } from "../utils/apiHelpers.js";

const router = express.Router();

// No auth on purpose: this only ever returns date ranges (start/end),
// never customer name/phone/address/price — nothing here is sensitive.
// Public so the calendar on /sewa can grey out taken dates before a
// customer submits, not just reject them after. Booked = DP confirmed,
// Ongoing = camera's literally out with someone — both make the date
// unavailable, unlike Pending (no DP yet, could still fall through).
router.get("/availability/booked-dates", async (req, res) => {
  try {
    const docs = await Transaction.find(
      { status: { $in: ["Booked", "Ongoing"] }, tanggalSewa: { $ne: null }, tanggalKembali: { $ne: null } },
      "tanggalSewa tanggalKembali"
    );
    const booked = docs.map((d) => ({
      start: d.tanggalSewa.toISOString().slice(0, 10),
      end: d.tanggalKembali.toISOString().slice(0, 10),
    }));
    res.json({ booked });
  } catch (err) {
    fail(res, err);
  }
});

export default router;

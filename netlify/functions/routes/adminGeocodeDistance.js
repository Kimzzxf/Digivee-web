import express from "express";
import { requireAdmin } from "../utils/adminAuth.js";
import { fail } from "../utils/apiHelpers.js";
import { distanceFromBase } from "../utils/geoDistance.js";

const router = express.Router();

router.get("/admin/geocode-distance", requireAdmin, async (req, res) => {
  try {
    const alamat = String(req.query.alamat || "").trim();
    const kota = String(req.query.kota || "Karawang").trim();
    res.json(await distanceFromBase(alamat, kota));
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    fail(res, err);
  }
});

export default router;

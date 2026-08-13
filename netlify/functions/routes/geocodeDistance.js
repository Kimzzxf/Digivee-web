import express from "express";
import { fail } from "../utils/apiHelpers.js";
import { distanceFromBase } from "../utils/geoDistance.js";

const router = express.Router();

// Public (no requireAdmin) — same lookup as /admin/geocode-distance, just
// reachable from the public Sewa form so a customer's typed alamat can
// get an instant "kira-kira Zona berapa" hint before they pick a Meet
// Point, with no pin/map step. Doesn't touch the DB and echoes back
// nothing but what the customer already typed + OSM/OSRM's own public
// data, so this is the same trust level as GET
// /availability/booked-dates (also unauthenticated) — nothing here is
// sensitive enough to need a login.
router.get("/geocode-distance", async (req, res) => {
  try {
    const alamat = String(req.query.alamat || "").trim();
    const kota = String(req.query.kota || "Karawang").trim();
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    const coords = Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : undefined;
    res.json(await distanceFromBase(alamat, kota, coords));
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    fail(res, err);
  }
});

export default router;

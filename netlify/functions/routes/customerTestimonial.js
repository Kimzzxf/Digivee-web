import express from "express";
import { requireSelf } from "../utils/customerAuth.js";
import { serializeTestimonial } from "../utils/serialize.js";
import Customer from "../models/Customer.js";
import Transaction from "../models/Transaction.js";
import Testimonial from "../models/Testimonial.js";
import { fail, REAL_TX_STATUSES } from "../utils/apiHelpers.js";

const router = express.Router();

function isValidRating(n) {
  return Number.isInteger(n) && n >= 1 && n <= 10;
}

// Gate on a real (Completed) rental so testimonials can't be posted by an
// account that just registered — same eligibility check promo/loyalty
// already use (REAL_TX_STATUSES), reused rather than invented fresh here.
router.post("/customers/:id/testimonials", requireSelf, async (req, res) => {
  try {
    const b = req.body || {};
    const text = typeof b.text === "string" ? b.text.trim() : "";
    const ratingPelayanan = Number(b.rating_pelayanan);
    const ratingKondisiKamera = Number(b.rating_kondisi_kamera);
    const ratingProsesSewa = Number(b.rating_proses_sewa);
    const instagramUsername = typeof b.instagram_username === "string" ? b.instagram_username.trim().replace(/^@/, "").slice(0, 30) : "";
    const photos = Array.isArray(b.photos) ? b.photos.filter((p) => typeof p === "string" && p.trim()) : [];
    const consentSocialMedia = Boolean(b.consent_social_media);

    if (!text) {
      return res.status(400).json({ error: "Testimoni belum diisi." });
    }
    if (text.length > 500) {
      return res.status(400).json({ error: "Testimoni maksimal 500 karakter." });
    }
    if (![ratingPelayanan, ratingKondisiKamera, ratingProsesSewa].every(isValidRating)) {
      return res.status(400).json({ error: "Rating harus angka 1-10." });
    }
    if (photos.length > 5 || photos.some((p) => !/^https:\/\//.test(p))) {
      return res.status(400).json({ error: "Foto nggak valid (maks 5, hasil upload)." });
    }

    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ error: "Customer tidak ditemukan." });

    const hasCompletedRental = await Transaction.exists({
      customerId: customer._id,
      status: { $in: REAL_TX_STATUSES },
    });
    if (!hasCompletedRental) {
      return res.status(403).json({ error: "Testimoni cuma bisa diisi setelah rental selesai ya." });
    }

    const already = await Testimonial.exists({ customerId: customer._id });
    if (already) {
      return res.status(409).json({ error: "Kamu udah pernah kasih testimoni. Makasih ya!" });
    }

    const doc = await Testimonial.create({
      customerId: customer._id,
      nama: customer.nama,
      text,
      ratingPelayanan,
      ratingKondisiKamera,
      ratingProsesSewa,
      instagramUsername,
      photos,
      consentSocialMedia,
    });
    res.json(serializeTestimonial(doc));
  } catch (err) {
    // Unique index on customerId is the real backstop against a race
    // between the `already` check above and this insert — same duplicate
    // message either way.
    if (err?.code === 11000) {
      return res.status(409).json({ error: "Kamu udah pernah kasih testimoni. Makasih ya!" });
    }
    fail(res, err);
  }
});

// No auth: public social-proof feed for the landing page, same trust
// level as GET /availability/booked-dates — nothing sensitive in a
// testimonial (name + text + ratings, no phone/address). Only approved
// ones — see POST /admin/testimonials/:id/approve.
router.get("/testimonials", async (req, res) => {
  try {
    const docs = await Testimonial.find({ approved: true }).sort({ createdAt: -1 }).limit(24);
    res.json(docs.map((d) => serializeTestimonial(d)));
  } catch (err) {
    fail(res, err);
  }
});

export default router;

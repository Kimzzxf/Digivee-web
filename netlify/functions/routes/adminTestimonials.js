import express from "express";
import { requireAdmin } from "../utils/adminAuth.js";
import { serializeTestimonial } from "../utils/serialize.js";
import Testimonial from "../models/Testimonial.js";
import { fail } from "../utils/apiHelpers.js";

const router = express.Router();

// approved:1/true sorts after approved:0/false in ascending order, so
// pending ones (the ones actually needing admin attention) surface first
// without a separate tab/filter — newest-first within each group.
router.get("/admin/testimonials", requireAdmin, async (req, res) => {
  try {
    const docs = await Testimonial.find().sort({ approved: 1, createdAt: -1 }).limit(200);
    res.json(docs.map((d) => serializeTestimonial(d)));
  } catch (err) {
    fail(res, err);
  }
});

router.patch("/admin/testimonials/:id", requireAdmin, async (req, res) => {
  try {
    const approved = Boolean(req.body?.approved);
    const updated = await Testimonial.findByIdAndUpdate(req.params.id, { approved }, { new: true });
    if (!updated) return res.status(404).json({ error: "Testimoni tidak ditemukan." });
    res.json(serializeTestimonial(updated));
  } catch (err) {
    fail(res, err);
  }
});

router.delete("/admin/testimonials/:id", requireAdmin, async (req, res) => {
  try {
    const deleted = await Testimonial.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Testimoni tidak ditemukan." });
    res.json({ ok: true });
  } catch (err) {
    fail(res, err);
  }
});

export default router;

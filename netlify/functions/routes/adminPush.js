import express from "express";
import { requireAdmin } from "../utils/adminAuth.js";
import PushSubscription from "../models/PushSubscription.js";
import { fail } from "../utils/apiHelpers.js";

const router = express.Router();

router.post("/admin/push/subscribe", requireAdmin, async (req, res) => {
  try {
    const { endpoint, keys } = req.body || {};
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: "Push subscription tidak valid." });
    }
    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } },
      { upsert: true, setDefaultsOnInsert: true },
    );
    res.json({ ok: true });
  } catch (err) {
    fail(res, err);
  }
});

router.post("/admin/push/unsubscribe", requireAdmin, async (req, res) => {
  try {
    const { endpoint } = req.body || {};
    if (!endpoint)
      return res.status(400).json({ error: "endpoint wajib diisi." });
    await PushSubscription.deleteOne({ endpoint });
    res.json({ ok: true });
  } catch (err) {
    fail(res, err);
  }
});

export default router;

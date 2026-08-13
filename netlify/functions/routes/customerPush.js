import express from "express";
import { requireSelf } from "../utils/customerAuth.js";
import PushSubscription from "../models/PushSubscription.js";
import { fail } from "../utils/apiHelpers.js";

const router = express.Router();

// Same shape as POST /admin/push/subscribe (routes/adminPush.js), scoped to
// the logged-in customer instead of the shop — requireSelf makes sure a
// customer can only ever register a subscription under their own id, never
// someone else's :id from a guessed/shared URL.
router.post("/customers/:id/push/subscribe", requireSelf, async (req, res) => {
  try {
    const { endpoint, keys } = req.body || {};
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: "Push subscription tidak valid." });
    }
    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth }, customerId: req.params.id },
      { upsert: true, setDefaultsOnInsert: true }
    );
    res.json({ ok: true });
  } catch (err) {
    fail(res, err);
  }
});

router.post("/customers/:id/push/unsubscribe", requireSelf, async (req, res) => {
  try {
    const { endpoint } = req.body || {};
    if (!endpoint) return res.status(400).json({ error: "endpoint wajib diisi." });
    await PushSubscription.deleteOne({ endpoint, customerId: req.params.id });
    res.json({ ok: true });
  } catch (err) {
    fail(res, err);
  }
});

export default router;

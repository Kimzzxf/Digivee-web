import express from "express";
import bcrypt from "bcryptjs";
import Customer from "../models/Customer.js";
import { serializeCustomer } from "../utils/serialize.js";
import { issueCustomerSession } from "../utils/customerAuth.js";
import { fail, normalizePhone, isValidPin } from "../utils/apiHelpers.js";
import { notifyAdminNewCustomer } from "../utils/telegram.js";
import { notifyAdminNewCustomerPush } from "../utils/webpush.js";

/* ---------------------------------------------------------------- *
 * Public: WA number + 6-digit PIN auth, in 2 steps:
 *   1. POST /customers/login    -> see customerAuthLogin.js (404/needsPin
 *      tells the client to fall back to register/set-pin)
 *   2. POST /customers/register -> brand new account
 *      POST /customers/set-pin  -> see customerAuthLogin.js
 * Nama+WA alone is never enough to authenticate anymore.
 * ---------------------------------------------------------------- */

const router = express.Router();

router.post("/customers/register", async (req, res) => {
  try {
    const { nama, telp: telpRaw, pin, alamat, ref } = req.body || {};
    const telp = normalizePhone(telpRaw);
    if (!nama || !String(nama).trim()) {
      return res.status(400).json({ error: "Nama wajib diisi." });
    }
    if (telp.length < 9) {
      return res.status(400).json({ error: "Nomor WhatsApp tidak valid." });
    }
    if (!isValidPin(pin)) {
      return res.status(400).json({ error: "PIN harus 6 angka." });
    }

    const existing = await Customer.findOne({ telp });
    if (existing) {
      return existing.pinHash
        ? res.status(409).json({ error: "Nomor ini sudah terdaftar. Masuk pakai PIN kamu." })
        : res.status(409).json({ error: "Nomor ini sudah ada tapi belum punya PIN.", needsPin: true });
    }

    let referredBy = null;
    if (ref) {
      const referrer = await Customer.findById(ref).catch(() => null);
      if (referrer) referredBy = referrer._id;
    }

    const pinHash = await bcrypt.hash(String(pin), 10);
    const created = await Customer.create({
      nama: String(nama).trim(),
      telp,
      pinHash,
      referredBy,
      alamat: typeof alamat === "string" && alamat.trim() ? alamat.trim() : null,
    });
    const token = issueCustomerSession(created._id);
    // Fire-and-forget-but-awaited, same contract as notifyAdminNewOrderPush
    // in customerPendingTransaction.js: any failure is logged inside the
    // notifier itself and never turns a successful registration into an
    // error response.
    await Promise.all([notifyAdminNewCustomer({ customer: created }), notifyAdminNewCustomerPush({ customer: created })]);
    res.json({ ...serializeCustomer(created), token });
  } catch (err) {
    if (err.code === 11000) {
      // Race condition: someone registered with the same phone in between the
      // findOne and create calls above.
      return res.status(409).json({ error: "Nomor ini barusan kedaftar. Coba masuk lagi." });
    }
    fail(res, err);
  }
});

export default router;

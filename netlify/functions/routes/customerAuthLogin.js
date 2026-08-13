import express from "express";
import bcrypt from "bcryptjs";
import Customer from "../models/Customer.js";
import { serializeCustomer } from "../utils/serialize.js";
import { issueCustomerSession } from "../utils/customerAuth.js";
import { fail, normalizePhone, isValidPin, PIN_MAX_ATTEMPTS, PIN_LOCK_MINUTES, getClientIp } from "../utils/apiHelpers.js";
import { ipLockoutMinutesLeft, recordIpFailure, clearIpFailures } from "../utils/ipLockout.js";

const router = express.Router();

router.post("/customers/set-pin", async (req, res) => {
  try {
    const telp = normalizePhone(req.body?.telp);
    const { pin } = req.body || {};
    if (!isValidPin(pin)) {
      return res.status(400).json({ error: "PIN harus 6 angka." });
    }

    const ip = getClientIp(req);
    const ipMinsLeft = await ipLockoutMinutesLeft(ip, "set-pin");
    if (ipMinsLeft) {
      return res.status(429).json({ error: `Terlalu banyak percobaan dari jaringan ini. Coba lagi ${ipMinsLeft} menit lagi.` });
    }
    // Every call counts, not just failed ones — unlike login there's no
    // right/wrong PIN to compare here (this route sets whatever PIN it's
    // given), so a script trying many phone numbers from one IP is the
    // thing this needs to catch, not repeated misses on one account.
    await recordIpFailure(ip, "set-pin");

    const existing = await Customer.findOne({ telp });
    if (!existing) {
      return res.status(404).json({ error: "Nomor belum terdaftar. Daftar dulu." });
    }
    if (existing.pinHash) {
      return res.status(409).json({ error: "Akun ini sudah punya PIN. Masuk pakai PIN kamu." });
    }
    existing.pinHash = await bcrypt.hash(String(pin), 10);
    existing.pinFailCount = 0;
    existing.pinLockedUntil = null;
    await existing.save();
    const token = issueCustomerSession(existing._id);
    res.json({ ...serializeCustomer(existing), token });
  } catch (err) {
    fail(res, err);
  }
});

router.post("/customers/login", async (req, res) => {
  try {
    const telp = normalizePhone(req.body?.telp);
    const { pin } = req.body || {};
    if (!isValidPin(pin)) {
      return res.status(400).json({ error: "PIN harus 6 angka." });
    }

    const ip = getClientIp(req);
    const ipMinsLeft = await ipLockoutMinutesLeft(ip, "customer");
    if (ipMinsLeft) {
      return res.status(429).json({ error: `Terlalu banyak percobaan salah dari jaringan ini. Coba lagi ${ipMinsLeft} menit lagi.` });
    }

    const existing = await Customer.findOne({ telp });
    if (!existing) {
      return res.status(404).json({ error: "Nomor WA belum terdaftar." });
    }
    if (!existing.pinHash) {
      return res.status(409).json({ error: "Akun ini belum punya PIN.", needsPin: true });
    }
    if (existing.pinLockedUntil && existing.pinLockedUntil > new Date()) {
      const minsLeft = Math.max(1, Math.ceil((existing.pinLockedUntil - new Date()) / 60000));
      return res.status(429).json({ error: `Terlalu banyak percobaan salah. Coba lagi ${minsLeft} menit lagi.` });
    }

    const ok = await bcrypt.compare(String(pin), existing.pinHash);
    if (!ok) {
      existing.pinFailCount = (existing.pinFailCount || 0) + 1;
      if (existing.pinFailCount >= PIN_MAX_ATTEMPTS) {
        existing.pinLockedUntil = new Date(Date.now() + PIN_LOCK_MINUTES * 60000);
        existing.pinFailCount = 0;
      }
      await existing.save();
      await recordIpFailure(ip, "customer");
      return res.status(401).json({ error: "PIN salah." });
    }

    existing.pinFailCount = 0;
    existing.pinLockedUntil = null;
    await existing.save();
    await clearIpFailures(ip, "customer");
    const token = issueCustomerSession(existing._id);
    res.json({ ...serializeCustomer(existing), token });
  } catch (err) {
    fail(res, err);
  }
});

export default router;

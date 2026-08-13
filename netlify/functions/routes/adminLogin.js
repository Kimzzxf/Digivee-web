import express from "express";
import AdminLoginAttempt from "../models/AdminLoginAttempt.js";
import { issueAdminSession } from "../utils/adminAuth.js";
import {
  fail,
  normalizePhone,
  isValidPin,
  safeEqual,
  adminAllowedPhones,
  ADMIN_PIN_MAX_ATTEMPTS,
  ADMIN_PIN_LOCK_MINUTES,
  getClientIp,
} from "../utils/apiHelpers.js";
import {
  ipLockoutMinutesLeft,
  recordIpFailure,
  clearIpFailures,
} from "../utils/ipLockout.js";

const router = express.Router();

router.post("/admin/login", async (req, res) => {
  try {
    const telp = normalizePhone(req.body?.telp);
    const { pin } = req.body || {};
    if (telp.length < 9) {
      return res.status(400).json({ error: "Nomor WhatsApp tidak valid." });
    }
    if (!isValidPin(pin)) {
      return res.status(400).json({ error: "PIN harus 6 angka." });
    }
    if (!process.env.ADMIN_PIN) {
      return res
        .status(500)
        .json({
          error: "ADMIN_PIN belum diisi di environment variables server.",
        });
    }

    const ip = getClientIp(req);
    const ipMinsLeft = await ipLockoutMinutesLeft(ip, "admin");
    if (ipMinsLeft) {
      return res
        .status(429)
        .json({
          error: `Terlalu banyak percobaan salah dari jaringan ini. Coba lagi ${ipMinsLeft} menit lagi.`,
        });
    }

    const allowed = adminAllowedPhones();
    if (!allowed.includes(telp)) {
      return res
        .status(403)
        .json({ error: "Nomor ini nggak ada di daftar admin." });
    }

    let attempt = await AdminLoginAttempt.findOne({ telp });
    if (attempt?.lockedUntil && attempt.lockedUntil > new Date()) {
      const minsLeft = Math.max(
        1,
        Math.ceil((attempt.lockedUntil - new Date()) / 60000),
      );
      return res
        .status(429)
        .json({
          error: `Terlalu banyak percobaan salah. Coba lagi ${minsLeft} menit lagi.`,
        });
    }

    if (!safeEqual(pin, process.env.ADMIN_PIN)) {
      attempt = attempt || new AdminLoginAttempt({ telp });
      attempt.failCount = (attempt.failCount || 0) + 1;
      if (attempt.failCount >= ADMIN_PIN_MAX_ATTEMPTS) {
        attempt.lockedUntil = new Date(
          Date.now() + ADMIN_PIN_LOCK_MINUTES * 60000,
        );
        attempt.failCount = 0;
      }
      await attempt.save();
      await recordIpFailure(ip, "admin");
      return res.status(401).json({ error: "PIN admin salah." });
    }

    if (attempt && (attempt.failCount > 0 || attempt.lockedUntil)) {
      attempt.failCount = 0;
      attempt.lockedUntil = null;
      await attempt.save();
    }
    await clearIpFailures(ip, "admin");

    const token = issueAdminSession(telp);
    res.json({ token, telp });
  } catch (err) {
    fail(res, err);
  }
});

export default router;

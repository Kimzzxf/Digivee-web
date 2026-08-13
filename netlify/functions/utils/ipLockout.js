import IpLoginAttempt from "../models/IpLoginAttempt.js";
import { IP_MAX_ATTEMPTS, IP_LOCK_MINUTES } from "./apiHelpers.js";

// Minutes left if this IP is currently locked out for `scope`
// ("admin" | "customer"), else null. Check this before doing any
// telp/PIN work so a locked-out IP can't keep probing.
export async function ipLockoutMinutesLeft(ip, scope) {
  const attempt = await IpLoginAttempt.findOne({ key: `${scope}:${ip}` });
  if (attempt?.lockedUntil && attempt.lockedUntil > new Date()) {
    return Math.max(1, Math.ceil((attempt.lockedUntil - new Date()) / 60000));
  }
  return null;
}

// Bumps the counter for this IP+scope. For login-style scopes ("admin",
// "customer") call this exactly where the matching per-account failCount
// gets bumped — i.e. only on an actual wrong-PIN compare. For scopes with
// no right/wrong answer to compare (e.g. "set-pin", which just sets
// whatever PIN it's given), call it on every request instead — there the
// abuse signal is call volume itself, not repeated misses.
export async function recordIpFailure(ip, scope) {
  const key = `${scope}:${ip}`;
  const attempt = (await IpLoginAttempt.findOne({ key })) || new IpLoginAttempt({ key });
  attempt.failCount = (attempt.failCount || 0) + 1;
  if (attempt.failCount >= IP_MAX_ATTEMPTS) {
    attempt.lockedUntil = new Date(Date.now() + IP_LOCK_MINUTES * 60000);
    attempt.failCount = 0;
  }
  await attempt.save();
}

export async function clearIpFailures(ip, scope) {
  await IpLoginAttempt.updateOne({ key: `${scope}:${ip}` }, { failCount: 0, lockedUntil: null });
}

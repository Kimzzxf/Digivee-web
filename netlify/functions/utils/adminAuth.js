import jwt from "jsonwebtoken";

const SESSION_TTL = "7d";
// Pinned explicitly on both sign and verify so a token can never be forged
// by swapping in a different algorithm (e.g. "none", or an asymmetric alg
// where the "signature" is trivially guessable) — jsonwebtoken only trusts
// what's in this list, not whatever the token's own header claims.
const JWT_ALGORITHM = "HS256";

// Called once, right after a WA number + PIN passes the allowlist check in
// POST /admin/login. Everything after that runs off this token instead of
// re-checking the phone/PIN on every request.
export function issueAdminSession(telp) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET belum diisi di environment variables server.");
  }
  return jwt.sign({ telp }, secret, { expiresIn: SESSION_TTL, algorithm: JWT_ALGORITHM });
}

export function requireAdmin(req, res, next) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "ADMIN_SESSION_SECRET belum diisi di environment variables server." });
  }
  const authHeader = req.header("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return res.status(401).json({ error: "Belum login." });
  }
  try {
    const { telp } = jwt.verify(token, secret, { algorithms: [JWT_ALGORITHM] });
    req.adminPhone = telp;
    next();
  } catch {
    return res.status(401).json({ error: "Sesi admin habis atau tidak valid, login ulang." });
  }
}

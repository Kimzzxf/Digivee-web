import jwt from "jsonwebtoken";

const SESSION_TTL = "30d";
const JWT_ALGORITHM = "HS256";

// Issued once, right after a WA number + PIN passes register/set-pin/login
// below. Before this existed, the client just stored the customer's raw
// Mongo _id in localStorage and sent it straight back as "proof" of who
// they were — GET /customers/:id and GET /customers/:id/transactions never
// checked it against anything, so ANY id (guessed, or picked up from a
// shared ?ref=<id> referral link) worked. This token is what those two
// routes now actually verify against.
export function issueCustomerSession(customerId) {
  const secret = process.env.CUSTOMER_SESSION_SECRET;
  if (!secret) {
    throw new Error("CUSTOMER_SESSION_SECRET belum diisi di environment variables server.");
  }
  return jwt.sign({ sub: String(customerId) }, secret, { expiresIn: SESSION_TTL, algorithm: JWT_ALGORITHM });
}

// Verifies the bearer token AND that it belongs to the same customer the
// URL is asking about — this second check is the actual IDOR fix. Being
// logged in as customer A must never be enough to read customer B's data
// just by changing the :id in the URL.
export function requireSelf(req, res, next) {
  const secret = process.env.CUSTOMER_SESSION_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "CUSTOMER_SESSION_SECRET belum diisi di environment variables server." });
  }
  const authHeader = req.header("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return res.status(401).json({ error: "Belum login." });
  }
  try {
    const { sub } = jwt.verify(token, secret, { algorithms: [JWT_ALGORITHM] });
    if (sub !== req.params.id) {
      return res.status(403).json({ error: "Nggak boleh lihat data akun lain." });
    }
    next();
  } catch {
    return res.status(401).json({ error: "Sesi habis atau tidak valid, login ulang." });
  }
}

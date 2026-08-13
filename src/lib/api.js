const ADMIN_SESSION_KEY = "digivee_admin_session";
const CUSTOMER_SESSION_KEY = "digivee_customer_session";

async function request(path, { method = "GET", body, admin = false, customer = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (admin) {
    const token = localStorage.getItem(ADMIN_SESSION_KEY);
    if (token) headers["authorization"] = `Bearer ${token}`;
  }
  if (customer) {
    const token = localStorage.getItem(CUSTOMER_SESSION_KEY);
    if (token) headers["authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    // no JSON body (e.g. network-level failure page) — fall through to the
    // generic error below.
  }

  if (!res.ok) {
    const err = new Error(payload?.error || `Request gagal (${res.status}).`);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }

  return payload;
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: "GET" }),
  post: (path, body, opts) => request(path, { ...opts, method: "POST", body }),
  patch: (path, body, opts) => request(path, { ...opts, method: "PATCH", body }),
  del: (path, opts) => request(path, { ...opts, method: "DELETE" }),
};

/* -------------------------------------------------------------- *
 * Admin session: a JWT issued by POST /admin/login after the WA number
 * checks out against ADMIN_ALLOWED_PHONES and the PIN matches ADMIN_PIN,
 * both server-side. Kept in localStorage (same as the customer session)
 * so it survives closing the installed PWA — the JWT itself already
 * expires server-side after 7 days (SESSION_TTL in adminAuth.js), so
 * this just matches storage lifetime to the token's real lifetime
 * instead of logging admins out early on every app close.
 * -------------------------------------------------------------- */

export function saveAdminSession(token) {
  localStorage.setItem(ADMIN_SESSION_KEY, token);
}

export function getAdminSession() {
  return localStorage.getItem(ADMIN_SESSION_KEY);
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
}

/* -------------------------------------------------------------- *
 * Customer session: a JWT issued by register/set-pin/login, required
 * (and checked against the :id in the URL) by GET /customers/:id and
 * GET /customers/:id/transactions. Kept in localStorage since a
 * customer's login should survive closing the tab, same as before.
 * -------------------------------------------------------------- */

export function saveCustomerToken(token) {
  localStorage.setItem(CUSTOMER_SESSION_KEY, token);
}

export function getCustomerToken() {
  return localStorage.getItem(CUSTOMER_SESSION_KEY);
}

export function clearCustomerToken() {
  localStorage.removeItem(CUSTOMER_SESSION_KEY);
}

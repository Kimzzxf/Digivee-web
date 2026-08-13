import { api, saveCustomerToken, clearCustomerToken } from "./api.js";

const SESSION_KEY = "digivee_customer_id";

export function getReferralCodeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("ref");
}

// Where to send the customer after a successful login/register — e.g.
// /login?next=/sewa when "Mulai Sewa" was clicked while logged out.
export function getNextFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("next");
}

// `token` is the JWT the server issues alongside the customer record on
// register/set-pin/login — required for GET /customers/:id and
// GET /customers/:id/transactions to prove this browser is actually that
// customer, not just someone who found/guessed their id.
export function saveSession(customerId, token) {
  localStorage.setItem(SESSION_KEY, customerId);
  if (token) saveCustomerToken(token);
}

export function getSession() {
  return localStorage.getItem(SESSION_KEY);
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  clearCustomerToken();
}

/** Brand new account: nama + alamat + WA + a fresh 6-digit PIN. */
export async function registerCustomer(nama, telp, pin, alamat) {
  const ref = getReferralCodeFromUrl();
  const customer = await api.post("/customers/register", { nama, telp, pin, alamat, ref });
  saveSession(customer.id, customer.token);
  return customer;
}

/** Existing account that doesn't have a PIN yet (e.g. legacy import). */
export async function setNewPin(telp, pin) {
  const customer = await api.post("/customers/set-pin", { telp, pin });
  saveSession(customer.id, customer.token);
  return customer;
}

/** Existing account, normal login. */
export async function loginWithPin(telp, pin) {
  const customer = await api.post("/customers/login", { telp, pin });
  saveSession(customer.id, customer.token);
  return customer;
}

export async function getCurrentCustomer() {
  const id = getSession();
  if (!id) return null;
  try {
    return await api.get(`/customers/${id}`, { customer: true });
  } catch {
    return null;
  }
}

export async function getTransactions(customerId) {
  return api.get(`/customers/${customerId}/transactions`, { customer: true });
}

/** Customers who signed up via this customer's own ?ref= link. */
export async function getReferrals(customerId) {
  return api.get(`/customers/${customerId}/referrals`, { customer: true });
}

/** Customer editing their own nama/no WA/alamat from the Profile page. */
export async function updateProfile(customerId, nama, telp, alamat) {
  return api.patch(`/customers/${customerId}`, { nama, telp, alamat }, { customer: true });
}

// Customer lama dari sebelum alamat wajib diisi (atau data lama yang cuma
// nyimpen nama kota) — belum punya alamat lengkap buat delivery/pickup.
// Registrasi baru udah wajib isi alamat (lihat LoginRegisterStep), jadi ini
// otomatis cuma nyala buat akun lama. Dipakai admin Pelanggan table dan
// banner reminder di halaman Profile customer sendiri.
export function needsAddress(alamat) {
  const a = (alamat || "").trim().toLowerCase();
  return a === "" || a === "karawang";
}

// Server always stores the 62-prefixed form (see normalizePhone on the
// backend) — this flips it back to the everyday 0-prefixed form for display.
export function toLocalPhone(telp) {
  const digits = String(telp || "").replace(/[^0-9]/g, "");
  if (!digits) return "-";
  return digits.startsWith("62") ? `0${digits.slice(2)}` : digits;
}

// Masks a WA number for display, e.g. "081234567890" -> "0812xxxxx890" —
// hides everything except the operator prefix + last 3 digits.
export function maskPhone(telp) {
  const local = toLocalPhone(telp);
  if (local === "-" || local.length <= 7) return local;
  return `${local.slice(0, 4)}${"x".repeat(local.length - 7)}${local.slice(-3)}`;
}

export function loyaltyProgress(transactionCount) {
  const cyclePos = transactionCount % 4 === 0 && transactionCount > 0 ? 4 : transactionCount % 4;
  const eligibleNow = transactionCount > 0 && transactionCount % 4 === 0;
  const nextMilestone = Math.floor(transactionCount / 4) * 4 + 4;
  return { cyclePos, eligibleNow, nextMilestone };
}

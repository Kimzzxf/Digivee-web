// Shared contact-link builders for the Instagram + WhatsApp "hubungi kami"
// links shown in the Navbar (top bar + mobile menu) and the Landing page
// footer. Both env vars are public on purpose (same reasoning as
// VITE_ADMIN_WA_NUMBER in Sewa.jsx — an Instagram handle and a support WA
// number aren't secrets), so they're safe to bundle into client JS.
const ADMIN_WA_NUMBER = import.meta.env.VITE_ADMIN_WA_NUMBER || "6281234567890";
export const INSTAGRAM_URL =
  import.meta.env.VITE_INSTAGRAM_URL || "https://instagram.com/digivee_krw";

// Generic "I want to ask something" WA link, as opposed to the order-recap
// link in Sewa.jsx — this one's for the navbar/footer "contact support"
// buttons, not for confirming a specific booking.
export function supportWaUrl() {
  const text = "Halo MinV, aku mau tanya-tanya seputar sewa Digivee.";
  return `https://wa.me/${ADMIN_WA_NUMBER}?text=${encodeURIComponent(text)}`;
}

// Sewa form's distance hint shows this once geocode comes back past the
// 40km zona limit (see SewaBasicFields) — prefilled with alamat+km so
// MinV doesn't have to ask where the customer even is.
export function outOfRangeWaUrl(alamat, km) {
  const text = `Halo MinV, alamatku "${alamat}" (~${km}km dari Digivee, di luar zona 40km). Bisa dibantu?`;
  return `https://wa.me/${ADMIN_WA_NUMBER}?text=${encodeURIComponent(text)}`;
}

// keeps only digits and caps length — used for the PIN fields
export function onlyDigits(value, maxLen) {
  const digits = value.replace(/[^0-9]/g, "");
  return maxLen ? digits.slice(0, maxLen) : digits;
}

// The WA-number field doubles as the admin entry point: typing an email
// there (instead of a phone number) routes to the Google sign-in step
// below rather than the phone/PIN flow. So this field can't be digits-only
// like the PIN fields — it just strips characters that are never valid in
// either a phone number or an email, leaving digits, letters, and @._-
export function sanitizeIdentifier(value) {
  return value.replace(/[^0-9a-zA-Z@._-]/g, "");
}

// Shared field/button styling — transparent, bottom-border-only white field
// and the same outlined fill-on-hover button as the hero CTA, for the pink
// full-bleed login surface.
export const FIELD =
  "w-full px-0 py-2.5 bg-transparent border-0 border-b border-paper/40 text-paper placeholder:text-paper/50 font-body outline-none transition-colors focus:border-paper";
export const FIELD_PIN = `${FIELD} tracking-[0.5em]`;

export const STEP_TITLES = {
  login: "Masuk ke Profile",
  register: "Daftar Akun Baru",
  "set-pin": "Bikin PIN Baru",
  admin: "Admin",
};

export function stepSubtitle(step, foundNama) {
  const subtitles = {
    login: "Pakai nomor WA & PIN akun kamu",
    register: "Isi data buat bikin akun baru",
    "set-pin": foundNama
      ? `Halo, ${foundNama} — akun ketemu tapi belum punya PIN, bikin dulu ya`
      : "Akun ketemu tapi belum punya PIN, bikin dulu ya",
    admin: "Masuk pakai nomor WA & PIN admin",
  };
  return subtitles[step];
}

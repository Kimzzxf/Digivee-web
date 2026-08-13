import { useState, useEffect } from "react";
import { Gift, Star, Timer, MessageCircle } from "lucide-react";
import { combineDateTime } from "../../lib/time";

export function onlyDigits(value, maxLen) {
  const digits = value.replace(/[^0-9]/g, "");
  return maxLen ? digits.slice(0, maxLen) : digits;
}

export const EDIT_DISKON_LABELS = {
  referral_baru: "Diskon referral (baru diajak)",
  referral_kredit: "Kredit referral",
  loyalty: "Poin loyalitas",
};

export const EDIT_DISKON_ICONS = {
  referral_baru: Gift,
  referral_kredit: Gift,
  loyalty: Star,
};

// Kecil, dipakai di form "Catat Transaksi" buat nampilin satu baris promo
// yang eligible — tombol "Terapkan" cuma aktif kalau keuntungan transaksi ini
// (dihitung live dari biaya yang lagi diketik) masih aman sesudah dipotong.
export function DiskonButton({ label, icon: Icon, eligible, onClick, ineligibleReason = "keuntungan kurang" }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="font-mono text-xs flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
        {label}
      </span>
      {eligible ? (
        <button
          type="button"
          onClick={onClick}
          className="press-btn shrink-0 px-3 py-1 rounded-full bg-pink text-white font-mono text-[11px] font-bold hover:opacity-90 transition-opacity"
        >
          Terapkan
        </button>
      ) : (
        <span className="shrink-0 font-mono text-[10px] text-ink/50">{ineligibleReason}</span>
      )}
    </div>
  );
}

export function SummaryCard({ label, value, accent }) {
  return (
    <div className={`edit-frame p-3 md:p-4 ${accent ? "bg-pink" : "bg-paper"}`}>
      <p className="font-mono text-[10px] font-bold opacity-60 mb-1">{label}</p>
      <p className="font-display text-base md:text-lg">{value}</p>
    </div>
  );
}

// Rows are already fetched in one shot (Laporan loads all transactions,
// Pelanggan is capped at 100 server-side), so pagination is just slicing
// the loaded array client-side — no API page params needed at this size.
export const PAGE_SIZE = 10;

export function Pagination({ page, pageCount, onPageChange }) {
  if (pageCount <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-4 flex-wrap font-mono text-xs">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="press-btn px-3 py-1.5 rounded-full border border-ink/15 disabled:opacity-40 hover:border-ink/30 transition-colors"
      >
        ← Sebelumnya
      </button>
      <span className="px-2 font-bold whitespace-nowrap">
        Hal {page}/{pageCount}
      </span>
      <button
        onClick={() => onPageChange(Math.min(pageCount, page + 1))}
        disabled={page === pageCount}
        className="press-btn px-3 py-1.5 rounded-full border border-ink/15 disabled:opacity-40 hover:border-ink/30 transition-colors"
      >
        Berikutnya →
      </button>
    </div>
  );
}

export function SortSelect({ value, onChange, options, className = "" }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`px-3 py-1.5 rounded-full border border-ink/15 bg-paper font-mono text-xs font-bold outline-none focus:border-pink ${className}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Th({ children }) {
  return <th className="px-3 py-2 whitespace-nowrap">{children}</th>;
}

export function Td({ children, className = "", style }) {
  return (
    <td className={`px-3 py-2 whitespace-nowrap ${className}`} style={style}>
      {children}
    </td>
  );
}

// "3h 4j 5m" dari sebuah selisih waktu (ms) — dipakai bareng oleh
// ReturnCountdown (Ongoing) dan BookedCountdown (Booked) biar format
// angkanya konsisten di dua tempat itu.
function diffLabel(diffMs) {
  const totalMinutes = Math.floor(Math.abs(diffMs) / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  return [days ? `${days}h` : null, `${hours}j`, `${minutes}m`].filter(Boolean).join(" ");
}

// Live countdown ke tanggal + jam kembali — cuma dipasang di baris yang
// status-nya "Ongoing". Update tiap detik; kalau udah lewat target waktu
// kembali, tampilin "Terlambat ..." dengan warna pink biar admin langsung
// ngeh transaksi mana yang butuh follow-up.
export function ReturnCountdown({ tanggalKembali, jamKembali }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const target = combineDateTime(tanggalKembali, jamKembali);
  if (!target) return <span className="opacity-40">-</span>;

  const diffMs = target.getTime() - now;
  const overdue = diffMs < 0;

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold whitespace-nowrap ${overdue ? "text-pink" : "text-ink"}`}
      title={`Target kembali: ${tanggalKembali || "-"} ${jamKembali || ""} WIB`}
    >
      <Timer className="w-3 h-3 shrink-0" />
      {overdue ? `Terlambat ${diffLabel(diffMs)}` : diffLabel(diffMs)}
    </span>
  );
}

// Nomor telp customer ("08...") -> format wa.me ("62..."). Sama aturannya
// kayak VITE_ADMIN_WA_NUMBER di lib/contact.js, cuma dibalik: di sini
// tujuannya customer, bukan admin.
function waCustomerUrl(telp, text) {
  const number = (telp || "").replace(/\D/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

// Live countdown dari sekarang sampai H-1 tanggal sewa — dipasang di baris
// yang status-nya "Booked", jadi admin bisa lihat berapa lama lagi sebelum
// harus follow up DP/persiapan sebelum hari-H. Begitu H-1 kelewat, countdown
// diganti tombol "Follow Up" yang langsung buka chat WA ke customer.
export function BookedCountdown({ tanggalSewa, nama, telp }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const sewaDate = combineDateTime(tanggalSewa, "00:00");
  if (!sewaDate) return <span className="opacity-40">-</span>;
  const target = new Date(sewaDate.getTime() - 24 * 60 * 60 * 1000);
  const diffMs = target.getTime() - now;

  if (diffMs <= 0) {
    const text = `Halo ${nama || "kak"}, ini dari Digivee mau follow up soal booking sewa tanggal ${tanggalSewa} ya. Gimana kabarnya?`;
    return (
      <a
        href={waCustomerUrl(telp, text)}
        target="_blank"
        rel="noopener noreferrer"
        className="press-btn inline-flex items-center gap-1 px-2 py-1 rounded-full bg-pink text-white font-bold whitespace-nowrap hover:opacity-90 transition-opacity"
        title={`Follow up via WA ke ${telp || "-"}`}
      >
        <MessageCircle className="w-3 h-3 shrink-0" />
        Follow Up
      </a>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 font-bold whitespace-nowrap text-ink" title={`Batas follow up: H-1 (${tanggalSewa || "-"})`}>
      <Timer className="w-3 h-3 shrink-0" />
      {diffLabel(diffMs)}
    </span>
  );
}

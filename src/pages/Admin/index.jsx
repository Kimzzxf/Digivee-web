import { useState, useEffect } from "react";
import { Loader2, Plus, BarChart3, FileSpreadsheet, Users, MessageSquareText, Bell, BellOff, AlertTriangle } from "lucide-react";
import BackButton from "../../components/BackButton";
import { getAdminSession, clearAdminSession } from "../../lib/api";
import { pushSupported, isIos, isStandalone, getPushSubscription, enablePushNotifications, disablePushNotifications } from "../../lib/push";
import { useNotification } from "../../components/NotificationProvider";
import { ReturnCountdown } from "./shared";
import { useOverdueAlert } from "./useOverdueAlert";
import AdminLogin from "./AdminLogin";
import CatatTransaksi from "./CatatTransaksi";
import Analytics from "./Analytics";
import Laporan from "./Laporan";
import Pelanggan from "./Pelanggan";
import AdminTestimonials from "./AdminTestimonials";

const TABS = [
  { id: "catat", label: "Catat Transaksi", icon: Plus },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "laporan", label: "Laporan", icon: FileSpreadsheet },
  { id: "pelanggan", label: "Pelanggan", icon: Users },
  { id: "testimoni", label: "Testimoni", icon: MessageSquareText },
];

export default function Admin() {
  const [unlocked, setUnlocked] = useState(Boolean(getAdminSession()));
  const [tab, setTab] = useState("catat");
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const { success, error: notifyError } = useNotification();
  const overdue = useOverdueAlert(unlocked);

  // Reflects THIS browser's actual subscription state (not just "did the
  // admin click it before") — so the bell shows correctly if push was
  // revoked from browser settings, or on a device that's never enabled it.
  useEffect(() => {
    if (!unlocked) return;
    getPushSubscription()
      .then((sub) => setPushEnabled(Boolean(sub)))
      .catch(() => setPushEnabled(false));
  }, [unlocked]);

  async function togglePush() {
    setPushBusy(true);
    try {
      if (pushEnabled) {
        await disablePushNotifications();
        setPushEnabled(false);
        success("Notifikasi order dimatiin di device ini.");
      } else {
        await enablePushNotifications();
        setPushEnabled(true);
        success("Notifikasi order aktif di device ini.");
      }
    } catch (err) {
      notifyError(err.message || "Gagal mengubah notifikasi.");
    } finally {
      setPushBusy(false);
    }
  }

  if (!unlocked) {
    return (
      <section className="w-full min-h-[100dvh] bg-pink text-paper flex items-center px-5 md:px-8 py-16">
        <div className="w-full">
          <BackButton />
          <h1 className="font-display text-2xl mb-1">Admin</h1>
          <p className="font-mono text-xs text-paper/70 mb-6">Masuk pakai nomor WA & PIN admin</p>
          <AdminLogin onSuccess={() => setUnlocked(true)} />
        </div>
      </section>
    );
  }

  return (
    <div className="admin-scope px-4 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-6 md:px-5 md:pt-[calc(2.5rem+env(safe-area-inset-top))] md:pb-10">
      <BackButton to="/" label="Lihat Website" />
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 md:mb-6">
        <h1 className="font-display text-2xl md:text-3xl">Admin Digivee</h1>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-4">
            {pushSupported() && (
              <button
                onClick={togglePush}
                disabled={pushBusy}
                title={pushEnabled ? "Notifikasi order aktif — klik buat matiin" : "Aktifkan notifikasi order baru di device ini"}
                className={`press-btn flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-mono text-xs font-bold transition-colors disabled:opacity-60 ${
                  pushEnabled ? "bg-pink border-pink text-white" : "border-ink/15 text-ink/60 hover:border-ink/30 hover:text-ink"
                }`}
              >
                {pushBusy ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : pushEnabled ? (
                  <Bell className="w-3.5 h-3.5" />
                ) : (
                  <BellOff className="w-3.5 h-3.5" />
                )}
                {pushEnabled ? "Notif Aktif" : "Aktifkan Notif"}
              </button>
            )}
            <button
              onClick={() => {
                clearAdminSession();
                setUnlocked(false);
              }}
              className="kicker text-ink/50 hover:text-pink"
            >
              Kunci ↦
            </button>
          </div>
          {pushSupported() && !pushEnabled && isIos() && !isStandalone() && (
            <p className="font-mono text-[10px] text-ink/50 text-right max-w-[220px]">
              iPhone: Share → Add to Home Screen dulu, baru notif bisa diaktifin
            </p>
          )}
        </div>
      </div>

      {overdue.length > 0 && (
        <div className="bg-pink/15 border border-pink/40 rounded-lg px-4 py-3 mb-4 md:mb-6">
          <p className="font-mono text-xs font-bold flex items-center gap-1.5 mb-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            {overdue.length} rental belum balik
          </p>
          <ul className="font-mono text-xs space-y-1">
            {overdue.map((r) => (
              <li key={r.id} className="flex items-center gap-1.5">
                <span>{r.customers?.nama || "-"}</span>
                <span className="opacity-40">·</span>
                <ReturnCountdown tanggalKembali={r.tanggal_kembali} jamKembali={r.jam_kembali} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* overflow-x-auto: 4 tabs with full labels don't fit a phone width,
          this lets them scroll instead of wrapping into a cramped second
          row. Scrollbar stays visible (unlike the frontend's swipe
          galleries) — this is an internal tool, the bar is a useful
          "there's more" affordance for admins, not visual clutter to hide.
          shrink-0 keeps each button from getting squished by the scroll
          container. */}
      <div className="flex gap-2 mb-4 md:mb-6 overflow-x-auto" data-lenis-prevent>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`press-btn shrink-0 whitespace-nowrap flex items-center gap-1.5 px-4 py-2 rounded-full border font-body font-bold text-sm transition-colors ${
              tab === id ? "bg-pink border-pink text-white" : "border-ink/15 text-ink/60 hover:border-ink/30 hover:text-ink"
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {{ catat: <CatatTransaksi />, analytics: <Analytics />, laporan: <Laporan />, pelanggan: <Pelanggan />, testimoni: <AdminTestimonials /> }[tab]}
    </div>
  );
}

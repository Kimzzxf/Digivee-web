import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Bell, BellOff, Loader2, MessageSquareText } from "lucide-react";
import PageLoader from "../../components/PageLoader";
import BackButton from "../../components/BackButton";
import LoyaltyCard from "../../components/LoyaltyCard";
import { needsAddress } from "../../lib/customer";
import { pushSupported, isIos, isStandalone, getPushSubscription, enablePushNotifications, disablePushNotifications, customerPushTarget } from "../../lib/push";
import { useNotification } from "../../components/NotificationProvider";
import { useProfileData } from "./useProfileData";
import ProfileDetails from "./ProfileDetails";
import ProfileReferrals from "./ProfileReferrals";
import ProfileTransactionHistory from "./ProfileTransactionHistory";

export default function Profile() {
  const {
    customer,
    setCustomer,
    transactions,
    loading,
    error,
    realTransactionCount,
    cyclePos,
    eligibleNow,
    showReferrals,
    referrals,
    loadingReferrals,
    referralsError,
    toggleReferrals,
  } = useProfileData();

  // Reminder push langsung ke customer (balikin kamera H-3jam, sewa besok
  // H-1) — lihat netlify/functions/reminder-check.js. Sama pola toggle-nya
  // kayak bel admin di Admin/index.jsx, cuma target subscribe-nya beda
  // (lib/push.js customerPushTarget) dan butuh customer.id yang baru ada
  // setelah data profil selesai load, makanya dicek `customer &&` di bawah.
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const { success, error: notifyError } = useNotification();

  useEffect(() => {
    if (!customer) return;
    getPushSubscription()
      .then((sub) => setPushEnabled(Boolean(sub)))
      .catch(() => setPushEnabled(false));
  }, [customer]);

  async function toggleReminderPush() {
    setPushBusy(true);
    try {
      const target = customerPushTarget(customer.id);
      if (pushEnabled) {
        await disablePushNotifications(target);
        setPushEnabled(false);
        success("Reminder di device ini dimatiin.");
      } else {
        await enablePushNotifications(target);
        setPushEnabled(true);
        success("Reminder balikin kamera & H-1 aktif di device ini.");
      }
    } catch (err) {
      notifyError(err.message || "Gagal mengubah reminder.");
    } finally {
      setPushBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="px-5 pt-[calc(3rem+env(safe-area-inset-top))] pb-12">
        <BackButton className="hover:text-pink active:text-pink" />
        <PageLoader />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="px-5 pt-[calc(4rem+env(safe-area-inset-top))] pb-16 text-center">
        <BackButton className="hover:text-pink active:text-pink" />
        <p className="font-mono text-sm bg-pink/15 border border-pink/40 rounded-lg px-4 py-3 inline-block">{error}</p>
      </div>
    );
  }

  return (
    <div className="px-5 pt-[calc(4rem+env(safe-area-inset-top))] pb-16 md:pt-[calc(5rem+env(safe-area-inset-top))] md:pb-20">
      <BackButton className="hover:text-pink active:text-pink" />
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <h1 className="font-display text-3xl md:text-4xl">Profile Saya</h1>
        <div className="flex items-center gap-2">
          <Link
            to="/testimoni"
            className="press-btn flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-ink/15 text-ink/60 hover:border-ink/30 hover:text-ink font-mono text-xs font-bold transition-colors"
          >
            <MessageSquareText className="w-3.5 h-3.5" /> Testimoni
          </Link>
        {pushSupported() && (
          <button
            onClick={toggleReminderPush}
            disabled={pushBusy}
            title={
              pushEnabled
                ? "Reminder balikin kamera & H-1 aktif — klik buat matiin"
                : "Aktifkan reminder balikin kamera & H-1 di device ini"
            }
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
            Reminder
          </button>
        )}
        </div>
      </div>
      {isIos() && !isStandalone() && (
        <p className="font-mono text-[11px] text-ink/50 -mt-4 mb-4">
          Di iPhone, tombol Reminder cuma jalan kalau Digivee udah ditambahin ke Home Screen dulu.
        </p>
      )}

      {needsAddress(customer.alamat) && (
        <div className="bg-pink/15 border border-pink/40 rounded-lg px-4 py-3 mb-4 md:mb-6 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="font-mono text-xs">
            Alamat kamu belum lengkap. Lengkapi dulu di bagian <strong>Detail Profil</strong> di bawah ya, biar proses sewa/delivery lancar.
          </p>
        </div>
      )}

      <div className="md:grid md:grid-cols-2 md:gap-8 md:items-start">
        <LoyaltyCard
          customer={customer}
          cyclePos={cyclePos}
          eligibleNow={eligibleNow}
          visitCount={realTransactionCount}
        />

        <ProfileDetails customer={customer} onUpdate={setCustomer} />
      </div>

      <ProfileReferrals
        customer={customer}
        showReferrals={showReferrals}
        toggleReferrals={toggleReferrals}
        referrals={referrals}
        loadingReferrals={loadingReferrals}
        referralsError={referralsError}
      />

      <ProfileTransactionHistory transactions={transactions} />
    </div>
  );
}

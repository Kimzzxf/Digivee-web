import { Loader2, Users, ChevronDown, ChevronUp } from "lucide-react";
import Loading from "../../components/Loading";

export default function ProfileReferrals({ customer, showReferrals, toggleReferrals, referrals, loadingReferrals, referralsError }) {
  return (
    <div className="edit-frame p-5 md:p-6 mt-6">
      <p className="kicker text-smoke mb-3 flex items-center gap-1.5">
        <Users className="w-3.5 h-3.5" /> Referral
      </p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="font-mono text-sm space-y-1">
          <p>
            Diundang oleh:{" "}
            <span className="font-bold">
              {customer.referred_by_customer ? customer.referred_by_customer.nama : "—"}
            </span>
          </p>
          <p>
            Jumlah referral: <span className="font-bold">{customer.referral_count || 0}</span> orang
          </p>
        </div>
        <button
          onClick={toggleReferrals}
          disabled={loadingReferrals}
          className="press-btn px-4 py-2 rounded-full border border-ink/15 bg-sand/60 font-mono text-xs font-bold flex items-center gap-1.5 hover:border-ink/30 transition-colors disabled:opacity-60"
        >
          {loadingReferrals ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : showReferrals ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
          {showReferrals ? "Sembunyikan" : "Lihat Detail"}
        </button>
      </div>

      {showReferrals && (
        <div className="mt-4 pt-4 border-t border-ink/10">
          {referralsError ? (
            <p className="font-mono text-xs text-pink">{referralsError}</p>
          ) : loadingReferrals ? (
            <Loading label="Memuat referral..." className="text-ink/60" />
          ) : referrals && referrals.length === 0 ? (
            <p className="font-mono text-xs text-ink/60">Belum ada yang diundang.</p>
          ) : (
            <ul className="space-y-2">
              {(referrals || []).map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-2 font-mono text-xs bg-paper border border-ink/10 rounded-lg px-3 py-2"
                >
                  <span className="truncate">
                    {r.nama} <span className="text-ink/50">{r.telp}</span>
                  </span>
                  <span
                    className={`kicker px-2 py-0.5 rounded-full shrink-0 ${
                      r.referral_discount_used ? "bg-pink text-ink" : "bg-sand text-ink/70"
                    }`}
                  >
                    {r.referral_discount_used ? "sudah pakai diskon" : "belum pakai diskon"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

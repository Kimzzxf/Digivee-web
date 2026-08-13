import { Check, EyeOff, Trash2, Loader2, Star, Instagram, ShieldCheck } from "lucide-react";
import Loading from "../../components/Loading";
import useAdminTestimonials from "./useAdminTestimonials";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminTestimonials() {
  const { rows, loading, error, busyId, setApproved, removeTestimonial } = useAdminTestimonials();

  if (loading) {
    return (
      <div className="py-10">
        <Loading label="Memuat testimoni..." />
      </div>
    );
  }

  if (error) {
    return <p className="font-mono text-xs bg-pink/15 border border-pink/40 rounded-lg inline-block px-4 py-3">{error}</p>;
  }

  if (rows.length === 0) {
    return <p className="font-mono text-sm text-ink/50">Belum ada testimoni masuk.</p>;
  }

  return (
    <div className="space-y-3">
      {rows.map((t) => {
        const busy = busyId === t.id;
        return (
          <div key={t.id} className="edit-frame bg-paper p-4 md:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-body font-bold text-sm">{t.nama}</p>
                  <span
                    className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                      t.approved ? "bg-sand/60 text-ink/70" : "bg-pink/15 text-pink"
                    }`}
                  >
                    {t.approved ? "Tampil" : "Pending"}
                  </span>
                </div>
                <p className="font-mono text-[10px] text-ink/40">{formatDate(t.created_at)}</p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setApproved(t, !t.approved)}
                  disabled={busy}
                  title={t.approved ? "Sembunyikan dari halaman utama" : "Tampilkan di halaman utama"}
                  className={`press-btn flex items-center gap-1 px-3 py-1.5 rounded-full font-mono text-xs font-bold transition-colors disabled:opacity-60 ${
                    t.approved ? "border border-ink/15 text-ink/60 hover:border-ink/30 hover:text-ink" : "bg-pink text-white hover:opacity-90"
                  }`}
                >
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t.approved ? <EyeOff className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                  {t.approved ? "Sembunyikan" : "Setujui"}
                </button>
                <button
                  onClick={() => removeTestimonial(t)}
                  disabled={busy}
                  title="Hapus testimoni"
                  className="press-btn flex items-center gap-1 px-3 py-1.5 rounded-full border border-ink/15 text-ink/60 hover:border-pink hover:text-pink transition-colors disabled:opacity-60"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <p className="font-body text-sm text-ink/80 leading-relaxed mb-3">"{t.text}"</p>

            <div className="flex items-center gap-1.5 font-mono text-xs text-ink/50">
              <Star className="w-3.5 h-3.5 text-pink fill-current shrink-0" strokeWidth={1.5} />
              <span className="font-bold text-ink">{t.rating_average}/10</span>
              <span className="opacity-40">·</span>
              <span>Pelayanan {t.rating_pelayanan}</span>
              <span className="opacity-40">·</span>
              <span>Kamera {t.rating_kondisi_kamera}</span>
              <span className="opacity-40">·</span>
              <span>Proses {t.rating_proses_sewa}</span>
            </div>

            {(t.instagram_username || t.photos?.length > 0) && (
              <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-ink/10">
                {t.instagram_username && (
                  <span className="flex items-center gap-1 font-mono text-xs text-ink/60">
                    <Instagram className="w-3.5 h-3.5" strokeWidth={1.5} />@{t.instagram_username}
                  </span>
                )}
                {t.consent_social_media && (
                  <span className="flex items-center gap-1 font-mono text-[10px] font-bold text-pink">
                    <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.5} />Izin upload IG
                  </span>
                )}
                {t.photos?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 w-full">
                    {t.photos.map((url) => (
                      <a key={url} href={url} target="_blank" rel="noreferrer" className="w-14 h-14 rounded-lg overflow-hidden border border-ink/15 shrink-0">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

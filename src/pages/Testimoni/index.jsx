import { useState } from "react";
import { Send, Loader2, MessageSquareText, ImagePlus, X } from "lucide-react";
import BackButton from "../../components/BackButton";
import { getSession } from "../../lib/customer";
import { submitTestimonial } from "../../lib/testimonial";
import { uploadToCloudinary } from "../../lib/cloudinary";
import { useNotification } from "../../components/NotificationProvider";

const MAX_PHOTOS = 5;

// Same trio the backend validates (customerTestimonial.js) — "kondisi
// kamera" and "pelayanan" named explicitly in the brief, "proses sewa" is
// the catch-all for everything else (booking flow, ketepatan waktu, dll).
const CATEGORIES = [
  { key: "ratingPelayanan", label: "Pelayanan" },
  { key: "ratingKondisiKamera", label: "Kondisi Kamera" },
  { key: "ratingProsesSewa", label: "Proses Sewa" },
];

const inputCls =
  "w-full px-3 py-2.5 rounded-lg border border-ink/15 bg-paper text-ink font-body text-sm outline-none transition-colors focus:border-pink resize-none";
// Same rounded-full/font-mono/bg-pink primary-action shape ProfileDetails
// already uses for its own "Simpan" button — this page sits on the same
// paper background, so it borrows that convention instead of the shared
// <Button> component (which is styled paper-on-pink, for the Login/Sewa
// full-bleed forms this page isn't one of).
const submitCls =
  "press-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-full bg-pink text-white font-mono text-sm font-bold disabled:opacity-60";

export default function Testimoni() {
  const { success, error: notifyError } = useNotification();
  const [text, setText] = useState("");
  const [ratings, setRatings] = useState({ ratingPelayanan: 8, ratingKondisiKamera: 8, ratingProsesSewa: 8 });
  const [instagram, setInstagram] = useState("");
  const [photos, setPhotos] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  // Same average the backend already computes (serializeTestimonial) —
  // mirrored here client-side just for a live preview as sliders move.
  const overall =
    Math.round(((ratings.ratingPelayanan + ratings.ratingKondisiKamera + ratings.ratingProsesSewa) / 3) * 10) / 10;

  function setRating(key, value) {
    setRatings((prev) => ({ ...prev, [key]: Number(value) }));
  }

  async function handlePhotoChange(e) {
    const files = Array.from(e.target.files || []).slice(0, MAX_PHOTOS - photos.length);
    e.target.value = "";
    if (files.length === 0) return;
    setUploadingPhoto(true);
    try {
      const urls = await Promise.all(files.map(uploadToCloudinary));
      setPhotos((prev) => [...prev, ...urls]);
    } catch (err) {
      notifyError(err.message || "Upload foto gagal.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  function removePhoto(url) {
    setPhotos((prev) => prev.filter((p) => p !== url));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const customerId = getSession();
    if (!customerId || !text.trim()) return;
    setSubmitting(true);
    try {
      await submitTestimonial(customerId, {
        text: text.trim(),
        ...ratings,
        instagramUsername: instagram.trim(),
        photos,
        consentSocialMedia: photos.length > 0 && consent,
      });
      setSent(true);
    } catch (err) {
      notifyError(err.message || "Gagal kirim testimoni.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <section className="px-5 md:px-8 pt-[calc(4rem+env(safe-area-inset-top))] md:pt-[calc(5rem+env(safe-area-inset-top))] pb-16 md:pb-20 max-w-lg mx-auto text-center">
        <BackButton to="/" label="Kembali ke Beranda" className="mx-auto" />
        <MessageSquareText className="w-8 h-8 text-pink mx-auto mb-4" strokeWidth={1.5} />
        <h1 className="font-display text-3xl md:text-4xl mb-2">Makasih!</h1>
        <p className="font-body text-ink/70 leading-relaxed">
          Testimoni kamu udah tersimpan dan bakal muncul di halaman utama Digivee setelah direview.
        </p>
      </section>
    );
  }

  return (
    <section className="px-5 md:px-8 pt-[calc(4rem+env(safe-area-inset-top))] md:pt-[calc(5rem+env(safe-area-inset-top))] pb-16 md:pb-20 max-w-lg mx-auto">
      <BackButton />
      <p className="kicker text-pink mb-4">Testimoni</p>
      <h1 className="font-display text-4xl md:text-5xl tracking-tight mb-4">Gimana Pengalamanmu?</h1>
      <p className="font-body text-ink/70 max-w-md mb-10 leading-relaxed">
        Ceritain pengalaman sewa kamu — testimoni ini tampil di halaman utama Digivee.
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className="font-mono text-xs font-bold block mb-1">Testimoni</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            maxLength={500}
            required
            placeholder="Ceritain pengalaman sewa kamu di Digivee..."
            className={inputCls}
          />
          <p className="font-mono text-[11px] text-ink/40 mt-1 text-right">{text.length}/500</p>
        </div>

        <div className="space-y-6">
          {CATEGORIES.map((c) => (
            <div key={c.key}>
              <div className="flex items-baseline justify-between mb-2">
                <label className="font-mono text-xs font-bold">{c.label}</label>
                <span className="font-display text-pink text-lg leading-none">
                  {ratings[c.key]}
                  <span className="text-ink/30 text-xs">/10</span>
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={ratings[c.key]}
                onChange={(e) => setRating(c.key, e.target.value)}
                className="w-full accent-pink"
              />
            </div>
          ))}
          <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-pink/10">
            <span className="font-mono text-xs font-bold">Overall Experience</span>
            <span className="font-display text-pink text-2xl leading-none">
              {overall}
              <span className="text-ink/30 text-xs">/10</span>
            </span>
          </div>
        </div>

        <div>
          <label className="font-mono text-xs font-bold block mb-1">Username Instagram (opsional)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 font-body text-sm">@</span>
            <input
              type="text"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value.replace(/^@/, ""))}
              maxLength={30}
              placeholder="username_kamu"
              className={`${inputCls} pl-7`}
            />
          </div>
        </div>

        <div>
          <label className="font-mono text-xs font-bold block mb-2">Foto (opsional, maks {MAX_PHOTOS})</label>
          {photos.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {photos.map((url) => (
                <div key={url} className="relative w-16 h-16 rounded-lg overflow-hidden border border-ink/15">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(url)}
                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-ink/70 text-white flex items-center justify-center"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {photos.length < MAX_PHOTOS && (
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-ink/25 font-mono text-xs cursor-pointer hover:border-pink transition-colors">
              {uploadingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
              {uploadingPhoto ? "Mengupload..." : "Tambah foto"}
              <input type="file" accept="image/*" multiple onChange={handlePhotoChange} disabled={uploadingPhoto} className="hidden" />
            </label>
          )}
          {photos.length > 0 && (
            <label className="flex items-start gap-2.5 mt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-pink shrink-0"
              />
              <span className="font-body text-xs text-ink/70 leading-relaxed">
                Izinkan DIGIVEE untuk mengupload fotomu di social media DIGIVEE
              </span>
            </label>
          )}
        </div>

        <button type="submit" disabled={submitting || uploadingPhoto || !text.trim()} className={submitCls}>
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Kirim Testimoni
        </button>
      </form>
    </section>
  );
}

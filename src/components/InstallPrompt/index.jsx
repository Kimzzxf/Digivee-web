import { AnimatePresence, motion } from "framer-motion";
import { Share2, Plus, Download, X, ExternalLink } from "lucide-react";
import { useInstallPrompt } from "./useInstallPrompt";

const HINTS = {
  ios: (
    <>
      Ketuk <Share2 className="w-3.5 h-3.5 inline -mt-0.5 mx-0.5" strokeWidth={2.5} /> Share di Safari, lalu pilih{" "}
      <Plus className="w-3.5 h-3.5 inline -mt-0.5 mx-0.5" strokeWidth={2.5} />{" "}
      <span className="font-semibold">"Add to Home Screen"</span>. Sekali pasang, buka Digivee tinggal satu ketuk dan
      notifikasi order bisa aktif.
    </>
  ),
  inapp: (
    <>
      Link ini dibuka di dalam aplikasi lain, jadi belum bisa dipasang dari sini. Ketuk{" "}
      <ExternalLink className="w-3.5 h-3.5 inline -mt-0.5 mx-0.5" strokeWidth={2.5} /> atau menu{" "}
      <span className="font-semibold">⋮</span> di pojok, pilih <span className="font-semibold">"Buka di Browser"</span>{" "}
      (Chrome/Safari), baru pasang dari sana.
    </>
  ),
  firefox: (
    <>
      Buka menu <span className="font-semibold">≡</span> Firefox, lalu cari{" "}
      <span className="font-semibold">"Install"</span> atau <span className="font-semibold">"Add to Home Screen"</span>.
      Kalau nggak ada opsi itu, buka link ini di Chrome buat pasang otomatis.
    </>
  ),
  macos: (
    <>
      Di Safari, klik menu <span className="font-semibold">File → Add to Dock</span> (atau ikon{" "}
      <Share2 className="w-3.5 h-3.5 inline -mt-0.5 mx-0.5" strokeWidth={2.5} /> Share →{" "}
      <span className="font-semibold">"Add to Dock"</span>) buat pasang Digivee sebagai aplikasi.
    </>
  ),
  generic: (
    <>
      Buka menu browser kamu (biasanya ikon <span className="font-semibold">⋮</span> atau{" "}
      <Share2 className="w-3.5 h-3.5 inline -mt-0.5 mx-0.5" strokeWidth={2.5} />), lalu cari{" "}
      <span className="font-semibold">"Install app"</span> atau{" "}
      <span className="font-semibold">"Add to Home Screen"</span>.
    </>
  ),
};

export default function InstallPrompt() {
  const { deferredPrompt, hintVariant, visible, dismiss, handleInstallClick } = useInstallPrompt();

  if (!visible || (!deferredPrompt && !hintVariant)) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40, transition: { duration: 0.2 } }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="fixed z-[190] bottom-4 inset-x-4 sm:inset-x-auto sm:right-4 sm:w-[380px]"
        role="dialog"
        aria-label="Pasang Digivee ke Home Screen"
      >
        <div className="edit-frame bg-paper rounded-2xl shadow-soft relative overflow-hidden px-4 py-4">
          <button
            onClick={dismiss}
            className="press-btn absolute top-2.5 right-2.5 p-1 rounded-full text-ink/40 hover:text-ink hover:bg-ink/5 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-start gap-3 pr-6">
            <img src="/icon-192.png" alt="" className="w-11 h-11 rounded-xl border border-ink/10 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-display text-base leading-tight mb-1">Pasang Digivee di HP kamu</p>
              <p className="font-body text-xs text-ink/70 leading-relaxed">
                {hintVariant
                  ? HINTS[hintVariant]
                  : "Akses lebih cepat dari layar utama, tanpa buka browser dulu — sekali pasang, tinggal satu ketuk."}
              </p>
            </div>
          </div>

          {!hintVariant && (
            <button
              onClick={handleInstallClick}
              className="press-btn w-full mt-3.5 py-2.5 rounded-full bg-pink text-white font-body font-bold text-sm flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
            >
              <Download className="w-4 h-4" strokeWidth={2.5} />
              Pasang Aplikasi
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

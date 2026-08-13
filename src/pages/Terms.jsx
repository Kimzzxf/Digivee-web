import BackButton from "../components/BackButton";

// Syarat & Ketentuan — plain HTML content (not the WA-poster image): real
// text is selectable, linkable, indexable, and one place to edit later.
// Numbered-list device borrowed straight from PriceTable (kicker numeral +
// title + rule-hair divider) so this reads as part of the same site, not a
// bolted-on legal page.

const TERMS = [
  {
    title: "Return Condition",
    body: "Kamera harus dikembalikan dalam kondisi seperti awal sewa.",
  },
  {
    title: "Identity",
    body: "Menyerahkan identitas diri selama masa sewa (KTP / SIM / Kartu Pelajar / dll).",
  },
  {
    title: "Usage",
    body: "Penyewa tidak diperkenankan meminjamkan kamera ke pihak lain tanpa izin DIGIVEE.",
  },
  {
    title: "Extension",
    body: "Konfirmasi pengembalian atau penambahan durasi sewa maksimal 3 jam sebelum masa sewa berakhir.",
  },
  {
    title: "Late Return",
    body: (
      <>
        Telat 1–3 jam kena{" "}
        <span className="inline-block bg-sand text-ink font-mono text-xs font-bold px-2.5 py-1 rounded-full align-middle">
          10K
        </span>
        . Lebih dari 3 jam: denda senilai 1 hari durasi sewa sesuai zona, plus potongan durasi 50%.
      </>
    ),
  },
  {
    title: "Damage / Loss",
    body: (
      <>
        Kerusakan atau kehilangan ditanggung 100% oleh penyewa, plus denda{" "}
        <span className="inline-block bg-sand text-ink font-mono text-xs font-bold px-2.5 py-1 rounded-full align-middle">
          300K
        </span>
        .
      </>
    ),
  },
];

export default function Terms() {
  return (
    <section className="px-5 md:px-8 pt-[calc(4rem+env(safe-area-inset-top))] pb-16 md:pt-[calc(6rem+env(safe-area-inset-top))] md:pb-24 max-w-3xl mx-auto">
      <BackButton />
      <p className="kicker text-pink mb-4">Syarat &amp; Ketentuan</p>
      <h1 className="font-display text-4xl md:text-6xl tracking-tight mb-4">
        Simple Rules,
        <br />
        Better Experience.
      </h1>
      <p className="font-body text-ink/70 max-w-lg mb-14 leading-relaxed">
        Dengan menyewa kamera dari DIGIVEE, kamu otomatis menyetujui semua ketentuan di bawah ini.
      </p>

      <div>
        {TERMS.map((t, i) => (
          <div key={t.title} className="py-6 rule-hair flex gap-5 md:gap-8">
            <span className="font-display italic text-pink text-2xl md:text-3xl leading-none shrink-0 w-10">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <p className="font-body font-bold text-lg mb-1.5">{t.title}</p>
              <p className="font-body text-sm text-ink/70 leading-relaxed">{t.body}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="font-display italic text-lg md:text-xl text-ink/70 mt-14 leading-relaxed">
        "Please take care of what captures your best memories."
      </p>
    </section>
  );
}

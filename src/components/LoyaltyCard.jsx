import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, Loader2 } from "lucide-react";
import { renderLoyaltyCardCanvas, downloadCanvasPng } from "../lib/downloadLoyaltyCard";
import logoMark from "../assets/logo-mark.png";

export default function LoyaltyCard({ customer, cyclePos, eligibleNow, visitCount }) {
  const referralUrl = `${window.location.origin}/login?ref=${customer.id}`;
  const qrWrapRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [downloading, setDownloading] = useState(false);

  // On-screen preview — keeps the live stamp count. The download button
  // below renders its own separate (stamp-free) canvas.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const canvas = await renderLoyaltyCardCanvas({
        customer,
        cyclePos,
        visitCount,
        eligibleNow,
        qrSvgEl: qrWrapRef.current?.querySelector("svg"),
        logoUrl: logoMark,
      });
      if (cancelled) return;
      setImgSrc(canvas.toDataURL("image/png"));
    })();
    return () => {
      cancelled = true;
    };
  }, [customer, cyclePos, visitCount, eligibleNow]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // A fresh render, not canvasRef — the printed card skips the visit
      // stamps (they go stale the moment the next visit updates them),
      // while the on-screen card keeps showing them live.
      const printCanvas = await renderLoyaltyCardCanvas({
        customer,
        cyclePos,
        visitCount,
        eligibleNow,
        qrSvgEl: qrWrapRef.current?.querySelector("svg"),
        logoUrl: logoMark,
        hideStamps: true,
      });
      await downloadCanvasPng(
        printCanvas,
        `kartu-loyalitas-${(customer.nama || "digivee").trim().replace(/\s+/g, "-").toLowerCase()}.png`,
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="relative pop-in max-w-2xl">
      {/* off-screen QR — exists only to feed the canvas renderer above, never shown itself */}
      <div ref={qrWrapRef} className="absolute -left-[9999px] -top-[9999px]" aria-hidden="true">
        <QRCodeSVG value={referralUrl} size={112} fgColor="#3A4032" bgColor="#F4EAE1" level="M" />
      </div>

      <div className="edit-frame relative overflow-hidden shadow-editorial">
        {imgSrc ? (
          <img src={imgSrc} alt={`Kartu loyalitas ${customer.nama}`} className="w-full h-auto block" />
        ) : (
          <div className="w-full aspect-[1011/638] bg-pink flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        )}
      </div>

      <button
        onClick={handleDownload}
        disabled={downloading || !imgSrc}
        className="mt-3 inline-flex items-center gap-2 bg-ink text-paper font-mono text-xs px-4 py-2 border-3 border-ink hover:bg-paper hover:text-ink transition-colors disabled:opacity-60"
      >
        {downloading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        {downloading ? "Membuat Kartu..." : "Unduh Kartu"}
      </button>
    </div>
  );
}
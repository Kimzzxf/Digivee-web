import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { X, ScanLine } from "lucide-react";

// Pulls the customer id out of a scanned loyalty-card QR. The QR always
// encodes `${origin}/login?ref=<id>` (see LoyaltyCard.jsx) — same code,
// scanned with the phone's own camera app, is what drives the referral
// flow. Here we just read the same value straight from a video frame.
function extractCustomerId(text) {
  try {
    return new URL(text).searchParams.get("ref");
  } catch {
    return null;
  }
}

// Native BarcodeDetector (Chrome/Edge/Android WebView) needs no decode work
// at all — it reads straight off the <video>. Where it's missing (Firefox,
// older Safari) we fall back to jsQR, which needs actual pixels: draw the
// frame to a hidden canvas first, then decode that.
const hasBarcodeDetector =
  typeof window !== "undefined" && "BarcodeDetector" in window;

export default function QrScanModal({ onScan, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let stream;
    let rafId;
    let cancelled = false;
    // Some devices expose window.BarcodeDetector but throw constructing it
    // (e.g. qr_code format unsupported on that build) — an unguarded throw
    // here kills the effect before getUserMedia ever runs, so the modal
    // just shows a blank box with no error. Guard it, fall back to jsQR.
    let detector = null;
    if (hasBarcodeDetector) {
      try {
        detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      } catch {
        detector = null;
      }
    }

    async function decodeFrame() {
      if (detector) {
        const codes = await detector.detect(videoRef.current);
        return codes[0]?.rawValue;
      }
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      return jsQR(frame.data, frame.width, frame.height)?.data;
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        videoRef.current.srcObject = s;
        const tick = async () => {
          if (cancelled) return;
          try {
            const raw = await decodeFrame();
            const id = raw && extractCustomerId(raw);
            if (id) {
              onScan(id);
              return; // caller closes the modal, unmount handles cleanup
            }
          } catch {
            // a frame that fails to decode just gets retried next tick
          }
          rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
      })
      .catch(() =>
        setError("Gak bisa akses kamera. Cek izin kamera di browser."),
      );

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onScan]);

  return (
    <div className="modal-shell fixed inset-0 z-50 bg-ink/40">
      <div className="edit-frame bg-paper rounded-lg w-full max-w-lg max-h-[85dvh] p-4 md:p-5 pop-in flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg flex items-center gap-2">
            <ScanLine className="w-4 h-4" /> Scan QR Customer
          </h3>
          <button
            onClick={onClose}
            className="press-btn p-1.5 border border-ink/15 bg-sand/60 hover:border-ink/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error ? (
          <p className="font-mono text-xs bg-pink/15 border border-pink/40 px-4 py-3">
            {error}
          </p>
        ) : (
          <div className="relative overflow-hidden bg-ink flex-1">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* offscreen — only the jsQR fallback path draws into this */}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}
      </div>
    </div>
  );
}


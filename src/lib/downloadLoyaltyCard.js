// Draws the loyalty card onto a <canvas>. Used both to render the on-screen
// profile card and to produce the downloaded PNG — same function, so the
// two can never drift apart the way the old hand-styled JSX card did.
// Native Canvas 2D API only — no html2canvas, no new dependency.

const COLOR = {
  pink: "#FF8DA1",
  ink: "#3A4032",
  paper: "#F4EAE1",
  ivory: "#F4EAE1",
  sand: "#A3B19B",
  white: "#FFFFFF",
};

// keep in sync with tailwind.config.js `fontFamily`
const FONT_DISPLAY = "'Fraunces', serif";
const FONT_MONO = "'Cabinet Grotesk', sans-serif";

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// hair-space tracking between letters — an editorial small-caps kicker
// look without depending on ctx.letterSpacing (patchy canvas support).
function tracked(s) {
  return s.split("").join("\u2009\u2009");
}

// Printable download swaps the stamp row for one of these instead of just
// leaving blank space — a printed stamp count goes stale the moment the
// next visit updates it, a quote doesn't. Original lines, not quoting anyone.
const QUOTES = [
  "Setiap jepretan membekukan satu detik agar tak pernah hilang.",
  "Cahaya boleh berubah, tapi momen ini tetap milikmu.",
  "Kamera hanya alat — yang diabadikan adalah rasa.",
  "Sebuah foto adalah surat cinta untuk hari yang telah lewat.",
  "Diam sejenak, lalu klik — begitulah waktu dijaga.",
  "Ingatan memudar, tapi bingkai ini tidak.",
  "Yang terekam bukan sekadar gambar, tapi rasa yang pernah ada.",
  "Setiap kunjungan menambah satu lembar cerita.",
  "Foto terbaik selalu tentang siapa yang bersamamu saat itu.",
  "Waktu berlalu, tapi frame ini berhenti untukmu.",
  "Dari satu klik, lahir satu kenangan yang tak lekang.",
  "Cahaya pagi, senja, atau lampu kota — semua layak diabadikan.",
  "Kamera menangkap cahaya, hati menangkap makna.",
  "Setiap bingkai adalah bukti bahwa momen itu pernah nyata.",
  "Kembali dan abadikan lagi — ceritamu belum selesai.",
  "Yang sederhana pun berharga bila diabadikan dengan hati.",
];

// djb2-ish hash — good enough for "pick a stable index", not for anything
// security-sensitive. Same customer always lands on the same quote, so a
// re-download/re-print of the same card doesn't drift.
function pickQuote(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return QUOTES[h % QUOTES.length];
}

function wrapText(ctx, text, font, maxWidth) {
  ctx.font = font;
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (line && ctx.measureText(test).width > maxWidth) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function svgToImage(svgEl) {
  const xml = new XMLSerializer().serializeToString(svgEl);
  const src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(xml)))}`;
  const img = new Image();
  img.src = src;
  await img.decode();
  return img;
}

async function loadImage(url) {
  const img = new Image();
  img.src = url;
  await img.decode();
  return img;
}

/**
 * Draws the card onto a canvas and returns it (does not download).
 * @param {object} p
 * @param {{nama: string, telp?: string}} p.customer
 * @param {number} p.cyclePos      current position in the 4-stamp cycle (0-4)
 * @param {number} p.visitCount    total visits
 * @param {boolean} p.eligibleNow  reward unlocked?
 * @param {SVGSVGElement|null} p.qrSvgEl  a QR <svg> to rasterize onto the card
 * @param {string} [p.logoUrl]    digivee logo (e.g. imported logo-mark.png), used as watermark
 * @param {boolean} [p.hideStamps] swap the visit-stamps row for a per-customer quote — used for the
 *   printable download, since printed cards go stale the moment the customer's next visit updates
 *   the stamp count digitally.
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function renderLoyaltyCardCanvas({
  customer,
  cyclePos,
  visitCount,
  eligibleNow,
  qrSvgEl,
  logoUrl,
  hideStamps = false,
}) {
  if (document.fonts?.ready) await document.fonts.ready;
  const qrImg = qrSvgEl ? await svgToImage(qrSvgEl) : null;
  const logoImg = logoUrl ? await loadImage(logoUrl) : null;

  const W = 1011, // ID-1 (KTP/SIM) print size @ 300dpi: 85.6mm x 53.98mm.
    H = 638;
  // Every pixel constant below (margin, panel, fonts, stamp geometry) was
  // tuned for the old 1200x700 canvas — S rescales them all in one shot
  // instead of hand-recalculating each one. H isn't derived from S: the
  // KTP ratio (1011x638, 1.58:1) is squarer than the old design (1200x700,
  // 1.71:1), so scaling everything by S alone leaves a bit of vertical
  // room over — the existing blockTop centering math below already
  // absorbs that as extra top/bottom breathing space, no distortion.
  const S = W / 1200;
  const M = 64 * S, // margin — editorial layouts breathe
    panelSize = 220 * S; // QR panel width — also caps the quote's wrap width below
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  const hairline = "rgba(255,255,255,0.28)";

  // card background — solid pink, brand color carrying the whole surface;
  // everything on it renders white/high-contrast.
  roundRect(ctx, 0, 0, W, H, 20 * S);
  ctx.fillStyle = COLOR.pink;
  ctx.fill();

  // faint logo mark, bottom-right corner — a quiet debossed watermark
  if (logoImg) {
    const logoSize = 150 * S;
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.drawImage(logoImg, W - M - logoSize, H - M - logoSize, logoSize, logoSize * (logoImg.height / logoImg.width));
    ctx.restore();
  }

  // header row — tracked kicker left, location right (same lifestyle-brand
  // detail used in the site footer). Pinned to the top; only the middle
  // content block (name/stamps/QR) gets vertically centered below.
  const headerRuleY = M + 28 * S;
  const footerRuleY = H - M;
  ctx.textBaseline = "alphabetic";
  ctx.font = `600 ${15 * S}px ${FONT_MONO}`;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText(tracked("DIGIVEE — Member Card"), M, M);
  ctx.textAlign = "right";
  ctx.fillText(tracked("Karawang"), W - M, M);
  ctx.textAlign = "left";

  ctx.strokeStyle = hairline;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(M, headerRuleY);
  ctx.lineTo(W - M, headerRuleY);
  ctx.stroke();

  // text column offsets, all relative to blockTop — centering the whole
  // block (name -> status line) in the space between the two hairlines
  // is one formula instead of hand-tuned constants, so it stays centered
  // even if this column's content ever changes height.
  const REL = Object.fromEntries(
    Object.entries({ name: 54, phone: 86, rule2: 116, kicker2: 146, stamps: 168, quote: 152 }).map(
      ([k, v]) => [k, v * S]
    )
  );
  const stampR = 27 * S,
    stampGap = 18 * S;
  // Thin weight, not 400 — Fraunces only ships italic 500/600 by default,
  // so an italic-400 request silently substituted the nearest loaded
  // weight (500/600) and rendered bold instead of thin. index.html now
  // also loads italic 300 so this actually has a thin face to draw with.
  const QUOTE_FONT = `italic 300 ${24 * S}px ${FONT_DISPLAY}`;
  const QUOTE_LINE_H = 32 * S;
  const quoteLines = hideStamps
    ? wrapText(ctx, `\u201C${pickQuote(String(customer.id || customer.telp || customer.nama || ""))}\u201D`, QUOTE_FONT, W - M - panelSize - M - 40 * S)
    : [];
  REL.statusLine = REL.stamps + stampR * 2 + 46 * S;
  // Printable download ends at the quote — no "Nx sewa total" row below it
  // (that line stays on-screen only, see the !hideStamps guard further down).
  const contentHeight = hideStamps
    ? REL.quote + Math.max(quoteLines.length - 1, 0) * QUOTE_LINE_H + 28 * S
    : REL.statusLine + 10 * S;
  const blockTop = headerRuleY + (footerRuleY - headerRuleY - contentHeight) / 2;

  // name + phone
  ctx.fillStyle = COLOR.white;
  ctx.font = `600 ${56 * S}px ${FONT_DISPLAY}`;
  ctx.fillText(customer.nama || "", M, blockTop + REL.name);

  ctx.font = `400 ${20 * S}px ${FONT_MONO}`;
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillText(customer.telp || "", M, blockTop + REL.phone);

  ctx.beginPath();
  ctx.moveTo(M, blockTop + REL.rule2);
  ctx.lineTo(W - M, blockTop + REL.rule2);
  ctx.stroke();

  // stamps — filled ones pop as solid ink dots against the pink; empty
  // ones stay a quiet outline. Skipped on the printable download: a
  // printed stamp count is wrong the moment the next visit updates it.
  if (!hideStamps) {
    ctx.font = `600 ${13 * S}px ${FONT_MONO}`;
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillText(tracked("Kunjungan"), M, blockTop + REL.kicker2);

    const stampCy = blockTop + REL.stamps + stampR;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let n = 1; n <= 4; n++) {
      const cx = M + stampR + (n - 1) * (stampR * 2 + stampGap);
      const filled = n <= cyclePos;
      ctx.beginPath();
      ctx.arc(cx, stampCy, stampR, 0, Math.PI * 2);
      ctx.fillStyle = filled ? COLOR.white : "rgba(255,255,255,0.12)";
      ctx.fill();
      ctx.strokeStyle = filled ? COLOR.white : "rgba(255,255,255,0.55)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = filled ? COLOR.ink : "rgba(255,255,255,0.75)";
      ctx.font = `600 ${16 * S}px ${FONT_MONO}`;
      ctx.fillText(filled ? "\u2713" : String(n), cx, stampCy + 1);
    }
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  } else if (quoteLines.length) {
    // printable download — thin italic, aesthetic, stable per customer (see pickQuote)
    ctx.font = QUOTE_FONT;
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    quoteLines.forEach((line, i) => {
      ctx.fillText(line, M, blockTop + REL.quote + i * QUOTE_LINE_H);
    });
  }

  // status line — on-screen card only. The download drops the "Nx sewa
  // total" row entirely rather than leaving it blank: same "would go stale
  // the moment the next visit updates it" reason the stamps get swapped
  // for the quote above on that variant.
  if (!hideStamps) {
    ctx.font = `400 ${21 * S}px ${FONT_MONO}`;
    ctx.fillStyle = COLOR.white;
    const statusLine = eligibleNow
      ? `${visitCount}x sewa total \u2014 berhak reward sekarang!`
      : `${visitCount}x sewa total \u2014 menuju sewa ke-${Math.floor(visitCount / 4) * 4 + 4}`;
    ctx.fillText(statusLine, M, blockTop + REL.statusLine);
  }

  // QR panel — paper-white against the pink card, centered in the same
  // header-to-footer band as the text column
  const panelX = W - M - panelSize,
    panelY = headerRuleY + (footerRuleY - headerRuleY - (panelSize + 34 * S)) / 2;
  ctx.save();
  ctx.shadowColor = "rgba(58,64,50,0.25)";
  ctx.shadowBlur = 30 * S;
  ctx.shadowOffsetY = 14 * S;
  roundRect(ctx, panelX, panelY, panelSize, panelSize + 34 * S, 12 * S);
  ctx.fillStyle = COLOR.paper;
  ctx.fill();
  ctx.restore();
  if (qrImg) {
    const pad = 24 * S;
    ctx.drawImage(qrImg, panelX + pad, panelY + pad, panelSize - pad * 2, panelSize - pad * 2);
  }
  ctx.fillStyle = "rgba(58,64,50,0.55)";
  ctx.font = `500 ${13 * S}px ${FONT_MONO}`;
  ctx.textAlign = "center";
  ctx.fillText(tracked("Scan Referral"), panelX + panelSize / 2, panelY + panelSize + 22 * S);
  ctx.textAlign = "left";

  // footer — brand wordmark + a real line from the site (hero kicker),
  // not an invented founding date
  ctx.strokeStyle = hairline;
  ctx.beginPath();
  ctx.moveTo(M, footerRuleY);
  ctx.lineTo(W - M, footerRuleY);
  ctx.stroke();

  ctx.font = `italic 500 ${26 * S}px ${FONT_DISPLAY}`;
  ctx.fillStyle = COLOR.white;
  ctx.fillText("digivee", M, footerRuleY + 34 * S);

  ctx.font = `500 ${13 * S}px ${FONT_MONO}`;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.textAlign = "right";
  ctx.fillText(tracked("By DUA Collective"), W - M, footerRuleY + 34 * S);
  ctx.textAlign = "left";

  return canvas;
}

/** Triggers a PNG download of an already-rendered canvas (e.g. from renderLoyaltyCardCanvas). */
export function downloadCanvasPng(canvas, filename) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return resolve();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      resolve();
    }, "image/png");
  });
}
